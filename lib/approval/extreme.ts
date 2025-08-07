export interface ExtremeRiskApproval {
  amount: number;
  toAddress: string;
  fromAddress: string;
  timestamp: number;
  blocked: boolean;
  blockReason: string;
  requiresComplianceReview: boolean;
  complianceReviewPassed: boolean;
  deviceFingerprint?: string;
  ipAddress?: string;
  userLocation?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  riskScore: number;
  sanctionsCheck: boolean;
  blacklistCheck: boolean;
}

export interface ExtremeRiskPolicy {
  minAmount: number;
  maxAmount: number;
  requireComplianceReview: boolean;
  requireSanctionsCheck: boolean;
  requireBlacklistCheck: boolean;
  requireDeviceVerification: boolean;
  blockedCountries: string[];
  blockedAddresses: string[];
  velocityCheck: boolean;
  timeBasedRestrictions: boolean;
}

export const EXTREME_RISK_POLICY: ExtremeRiskPolicy = {
  minAmount: 7, // $7 USDC
  maxAmount: 9, // $9 USDC
  requireComplianceReview: true,
  requireSanctionsCheck: true,
  requireBlacklistCheck: true,
  requireDeviceVerification: true,
  blockedCountries: [
    'IR', // Iran
    'KP', // North Korea
    'CU', // Cuba
    'SY', // Syria
    'VE', // Venezuela
    'BY', // Belarus
    'RU', // Russia (partial sanctions)
    'CN'  // China (certain restrictions)
  ],
  blockedAddresses: [
    // This would be populated from Circle's Compliance Engine
    // or external blacklist services
  ],
  velocityCheck: true,
  timeBasedRestrictions: true
};

export class ExtremeRiskApprovalService {
  private recentTransactions: Map<string, Array<{ amount: number; timestamp: number }>> = new Map();
  private complianceReviews: Map<string, { approved: boolean; reviewer: string; timestamp: number }> = new Map();

  async checkExtremeRiskApproval(
    amount: number,
    toAddress: string,
    fromAddress: string,
    userCountry?: string,
    deviceFingerprint?: string,
    ipAddress?: string,
    userLocation?: {
      country: string;
      city: string;
      latitude: number;
      longitude: number;
    }
  ): Promise<ExtremeRiskApproval> {
    // Check amount range
    if (amount < EXTREME_RISK_POLICY.minAmount || amount > EXTREME_RISK_POLICY.maxAmount) {
      throw new Error(`Amount ${amount} is outside extreme risk range (${EXTREME_RISK_POLICY.minAmount}-${EXTREME_RISK_POLICY.maxAmount})`);
    }

    // Check blocked countries
    if (userCountry && EXTREME_RISK_POLICY.blockedCountries.includes(userCountry)) {
      return {
        amount,
        toAddress,
        fromAddress,
        timestamp: Date.now(),
        blocked: true,
        blockReason: `Country ${userCountry} is sanctioned and blocked from extreme risk transactions`,
        requiresComplianceReview: false,
        complianceReviewPassed: false,
        deviceFingerprint,
        ipAddress,
        userLocation,
        riskScore: 100,
        sanctionsCheck: true,
        blacklistCheck: true
      };
    }

    // Check blocked addresses
    if (EXTREME_RISK_POLICY.blockedAddresses.includes(toAddress)) {
      return {
        amount,
        toAddress,
        fromAddress,
        timestamp: Date.now(),
        blocked: true,
        blockReason: 'Destination address is blacklisted',
        requiresComplianceReview: false,
        complianceReviewPassed: false,
        deviceFingerprint,
        ipAddress,
        userLocation,
        riskScore: 100,
        sanctionsCheck: true,
        blacklistCheck: true
      };
    }

    // Velocity check (multiple transactions in short time)
    if (EXTREME_RISK_POLICY.velocityCheck) {
      const recent = this.recentTransactions.get(fromAddress) || [];
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentOneHour = recent.filter(t => t.timestamp > oneHourAgo);
      
      if (recentOneHour.length >= 1) {
        return {
          amount,
          toAddress,
          fromAddress,
          timestamp: Date.now(),
          blocked: true,
          blockReason: 'Too many extreme risk transactions in the last hour',
          requiresComplianceReview: false,
          complianceReviewPassed: false,
          deviceFingerprint,
          ipAddress,
          userLocation,
          riskScore: 95,
          sanctionsCheck: true,
          blacklistCheck: true
        };
      }
    }

    // Time-based restrictions
    if (EXTREME_RISK_POLICY.timeBasedRestrictions) {
      const currentHour = new Date().getHours();
      if (currentHour < 8 || currentHour > 18) {
        return {
          amount,
          toAddress,
          fromAddress,
          timestamp: Date.now(),
          blocked: true,
          blockReason: 'Extreme risk transactions are only allowed between 8 AM and 6 PM local time',
          requiresComplianceReview: false,
          complianceReviewPassed: false,
          deviceFingerprint,
          ipAddress,
          userLocation,
          riskScore: 90,
          sanctionsCheck: true,
          blacklistCheck: true
        };
      }
    }

    // Sanctions check
    const sanctionsCheck = await this.performSanctionsCheck(fromAddress, toAddress, userCountry);
    if (!sanctionsCheck.passed) {
      return {
        amount,
        toAddress,
        fromAddress,
        timestamp: Date.now(),
        blocked: true,
        blockReason: `Sanctions check failed: ${sanctionsCheck.reason}`,
        requiresComplianceReview: false,
        complianceReviewPassed: false,
        deviceFingerprint,
        ipAddress,
        userLocation,
        riskScore: 100,
        sanctionsCheck: false,
        blacklistCheck: true
      };
    }

    // Blacklist check
    const blacklistCheck = await this.performBlacklistCheck(toAddress);
    if (!blacklistCheck.passed) {
      return {
        amount,
        toAddress,
        fromAddress,
        timestamp: Date.now(),
        blocked: true,
        blockReason: `Blacklist check failed: ${blacklistCheck.reason}`,
        requiresComplianceReview: false,
        complianceReviewPassed: false,
        deviceFingerprint,
        ipAddress,
        userLocation,
        riskScore: 100,
        sanctionsCheck: true,
        blacklistCheck: false
      };
    }

    // Calculate risk score
    const riskScore = await this.calculateExtremeRiskScore(amount, toAddress, userLocation);

    // If risk score is too high, block immediately
    if (riskScore >= 90) {
      return {
        amount,
        toAddress,
        fromAddress,
        timestamp: Date.now(),
        blocked: true,
        blockReason: `Risk score too high: ${riskScore}`,
        requiresComplianceReview: false,
        complianceReviewPassed: false,
        deviceFingerprint,
        ipAddress,
        userLocation,
        riskScore,
        sanctionsCheck: true,
        blacklistCheck: true
      };
    }

    // Check if compliance review is required
    const requiresComplianceReview = EXTREME_RISK_POLICY.requireComplianceReview || riskScore >= 70;
    
    if (requiresComplianceReview) {
      const existingReview = this.complianceReviews.get(fromAddress);
      if (!existingReview || !existingReview.approved) {
        return {
          amount,
          toAddress,
          fromAddress,
          timestamp: Date.now(),
          blocked: false,
          blockReason: '',
          requiresComplianceReview: true,
          complianceReviewPassed: false,
          deviceFingerprint,
          ipAddress,
          userLocation,
          riskScore,
          sanctionsCheck: true,
          blacklistCheck: true
        };
      }
    }

    // Update tracking
    const recent = this.recentTransactions.get(fromAddress) || [];
    recent.push({ amount, timestamp: Date.now() });
    this.recentTransactions.set(fromAddress, recent.slice(-2)); // Keep last 2 transactions

    return {
      amount,
      toAddress,
      fromAddress,
      timestamp: Date.now(),
      blocked: false,
      blockReason: '',
      requiresComplianceReview: false,
      complianceReviewPassed: true,
      deviceFingerprint,
      ipAddress,
      userLocation,
      riskScore,
      sanctionsCheck: true,
      blacklistCheck: true
    };
  }

  private async performSanctionsCheck(
    fromAddress: string,
    toAddress: string,
    userCountry?: string
  ): Promise<{ passed: boolean; reason?: string }> {
    // This would integrate with Circle's Compliance Engine
    // For now, return passed as a placeholder
    return { passed: true };
  }

  private async performBlacklistCheck(toAddress: string): Promise<{ passed: boolean; reason?: string }> {
    // This would integrate with Circle's Compliance Engine or external blacklist services
    // For now, return passed as a placeholder
    return { passed: true };
  }

  private async calculateExtremeRiskScore(
    amount: number,
    toAddress: string,
    userLocation?: {
      country: string;
      city: string;
      latitude: number;
      longitude: number;
    }
  ): Promise<number> {
    let riskScore = 0;

    // Amount-based risk
    if (amount > 100000) riskScore += 40;
    if (amount > 500000) riskScore += 30;

    // Location-based risk
    if (userLocation) {
      const highRiskCountries = ['CY', 'MT', 'BG', 'RO', 'HR', 'SI'];
      if (highRiskCountries.includes(userLocation.country)) {
        riskScore += 35;
      }
    }

    // Address-based risk (would integrate with compliance engine)
    const addressRisk = await this.performBlacklistCheck(toAddress);
    if (!addressRisk.passed) {
      riskScore += 50;
    }

    return Math.min(riskScore, 100);
  }

  getRecentTransactions(fromAddress: string): Array<{ amount: number; timestamp: number }> {
    return this.recentTransactions.get(fromAddress) || [];
  }

  getComplianceReview(fromAddress: string) {
    return this.complianceReviews.get(fromAddress);
  }

  approveComplianceReview(fromAddress: string, reviewer: string): boolean {
    this.complianceReviews.set(fromAddress, {
      approved: true,
      reviewer,
      timestamp: Date.now()
    });
    return true;
  }

  rejectComplianceReview(fromAddress: string, reviewer: string): boolean {
    this.complianceReviews.set(fromAddress, {
      approved: false,
      reviewer,
      timestamp: Date.now()
    });
    return true;
  }

  isEligibleForExtremeRisk(
    amount: number,
    userCountry?: string,
    deviceFingerprint?: string
  ): boolean {
    return (
      amount >= EXTREME_RISK_POLICY.minAmount &&
      amount <= EXTREME_RISK_POLICY.maxAmount &&
      (!userCountry || !EXTREME_RISK_POLICY.blockedCountries.includes(userCountry))
    );
  }

  async performComplianceReview(
    fromAddress: string,
    toAddress: string,
    amount: number,
    userLocation?: {
      country: string;
      city: string;
      latitude: number;
      longitude: number;
    }
  ): Promise<{
    approved: boolean;
    riskScore: number;
    recommendations: string[];
  }> {
    const riskScore = await this.calculateExtremeRiskScore(amount, toAddress, userLocation);
    
    const recommendations: string[] = [];
    
    if (riskScore > 80) {
      recommendations.push('Consider breaking transaction into smaller amounts');
      recommendations.push('Verify recipient identity through additional channels');
      recommendations.push('Consider using escrow service for large amounts');
    }

    return {
      approved: riskScore < 90,
      riskScore,
      recommendations
    };
  }
}

export const extremeRiskApprovalService = new ExtremeRiskApprovalService();
