export interface VeryHighRiskApproval {
  amount: number;
  toAddress: string;
  fromAddress: string;
  timestamp: number;
  requiresPasskey: boolean;
  requiresBiometric: boolean;
  requiresManualApproval: boolean;
  requiresGeoCheck: boolean;
  passkeyVerified: boolean;
  biometricVerified: boolean;
  manualApproved: boolean;
  geoCheckPassed: boolean;
  deviceFingerprint?: string;
  ipAddress?: string;
  userLocation?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  riskScore?: number;
}

export interface VeryHighRiskPolicy {
  minAmount: number;
  maxAmount: number;
  maxDailyLimit: number;
  requirePasskey: boolean;
  requireBiometric: boolean;
  requireManualApproval: boolean;
  requireGeoCheck: boolean;
  requireDeviceVerification: boolean;
  allowedCountries: string[];
  velocityCheck: boolean;
  addressRiskCheck: boolean;
  timeBasedRestrictions: boolean;
}

export const VERY_HIGH_RISK_POLICY: VeryHighRiskPolicy = {
  minAmount: 5, // $5 USDC
  maxAmount: 7, // $7 USDC
  maxDailyLimit: 100, // $100 USDC per day
  requirePasskey: true,
  requireBiometric: true,
  requireManualApproval: true,
  requireGeoCheck: true,
  requireDeviceVerification: true,
  allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'SG', 'NL', 'SE', 'CH', 'NO', 'DK', 'FI', 'AT', 'BE', 'LU'],
  velocityCheck: true,
  addressRiskCheck: true,
  timeBasedRestrictions: true
};

export class VeryHighRiskApprovalService {
  private dailyTransactions: Map<string, number> = new Map();
  private lastResetDate: string = new Date().toDateString();
  private recentTransactions: Map<string, Array<{ amount: number; timestamp: number }>> = new Map();
  private pendingApprovals: Map<string, { amount: number; toAddress: string; timestamp: number }> = new Map();

  async checkVeryHighRiskApproval(
    amount: number,
    toAddress: string,
    fromAddress: string,
    userCountry?: string,
    deviceFingerprint?: string,
    ipAddress?: string,
    passkeyVerified: boolean = false,
    biometricVerified: boolean = false,
    manualApproved: boolean = false,
    userLocation?: {
      country: string;
      city: string;
      latitude: number;
      longitude: number;
    }
  ): Promise<VeryHighRiskApproval> {
    // Reset daily limits if it's a new day
    this.resetDailyLimitsIfNeeded();

    // Check amount range
    if (amount < VERY_HIGH_RISK_POLICY.minAmount || amount > VERY_HIGH_RISK_POLICY.maxAmount) {
      throw new Error(`Amount ${amount} is outside very high risk range (${VERY_HIGH_RISK_POLICY.minAmount}-${VERY_HIGH_RISK_POLICY.maxAmount})`);
    }

    // Check daily limit
    const dailyTotal = this.dailyTransactions.get(fromAddress) || 0;
    if (dailyTotal + amount > VERY_HIGH_RISK_POLICY.maxDailyLimit) {
      throw new Error(`Daily limit exceeded. Current: ${dailyTotal}, Attempting: ${amount}, Limit: ${VERY_HIGH_RISK_POLICY.maxDailyLimit}`);
    }

    // Check country restrictions
    if (userCountry && !VERY_HIGH_RISK_POLICY.allowedCountries.includes(userCountry)) {
      throw new Error(`Country ${userCountry} not allowed for very high risk transactions`);
    }

    // Velocity check (multiple transactions in short time)
    if (VERY_HIGH_RISK_POLICY.velocityCheck) {
      const recent = this.recentTransactions.get(fromAddress) || [];
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentOneHour = recent.filter(t => t.timestamp > oneHourAgo);
      
      if (recentOneHour.length >= 2) {
        throw new Error('Too many very high-risk transactions in the last hour. Please wait before making another transaction.');
      }
    }

    // Address risk check
    if (VERY_HIGH_RISK_POLICY.addressRiskCheck) {
      const isRiskyAddress = await this.checkAddressRisk(toAddress);
      if (isRiskyAddress) {
        throw new Error('Destination address has been flagged as very high risk. Transaction blocked.');
      }
    }

    // Time-based restrictions
    if (VERY_HIGH_RISK_POLICY.timeBasedRestrictions) {
      const currentHour = new Date().getHours();
      if (currentHour < 6 || currentHour > 22) {
        throw new Error('Very high risk transactions are only allowed between 6 AM and 10 PM local time.');
      }
    }

    // Geo check
    let geoCheckPassed = false;
    if (VERY_HIGH_RISK_POLICY.requireGeoCheck && userLocation) {
      geoCheckPassed = await this.performGeoCheck(userLocation, ipAddress);
      if (!geoCheckPassed) {
        throw new Error('Geographic location verification failed. Transaction blocked.');
      }
    }

    // Require passkey verification
    if (VERY_HIGH_RISK_POLICY.requirePasskey && !passkeyVerified) {
      throw new Error('Passkey verification required for very high risk transactions');
    }

    // Require biometric verification
    if (VERY_HIGH_RISK_POLICY.requireBiometric && !biometricVerified) {
      throw new Error('Biometric verification required for very high risk transactions');
    }

    // Require manual approval
    if (VERY_HIGH_RISK_POLICY.requireManualApproval && !manualApproved) {
      // Create pending approval
      this.pendingApprovals.set(fromAddress, {
        amount,
        toAddress,
        timestamp: Date.now()
      });

      return {
        amount,
        toAddress,
        fromAddress,
        timestamp: Date.now(),
        requiresPasskey: VERY_HIGH_RISK_POLICY.requirePasskey,
        requiresBiometric: VERY_HIGH_RISK_POLICY.requireBiometric,
        requiresManualApproval: VERY_HIGH_RISK_POLICY.requireManualApproval,
        requiresGeoCheck: VERY_HIGH_RISK_POLICY.requireGeoCheck,
        passkeyVerified,
        biometricVerified,
        manualApproved: false,
        geoCheckPassed,
        deviceFingerprint,
        ipAddress,
        userLocation,
        riskScore: await this.calculateRiskScore(amount, toAddress, userLocation)
      };
    }

    // Update tracking
    this.dailyTransactions.set(fromAddress, dailyTotal + amount);
    
    const recent = this.recentTransactions.get(fromAddress) || [];
    recent.push({ amount, timestamp: Date.now() });
    this.recentTransactions.set(fromAddress, recent.slice(-3)); // Keep last 3 transactions

    return {
      amount,
      toAddress,
      fromAddress,
      timestamp: Date.now(),
      requiresPasskey: VERY_HIGH_RISK_POLICY.requirePasskey,
      requiresBiometric: VERY_HIGH_RISK_POLICY.requireBiometric,
      requiresManualApproval: VERY_HIGH_RISK_POLICY.requireManualApproval,
      requiresGeoCheck: VERY_HIGH_RISK_POLICY.requireGeoCheck,
      passkeyVerified,
      biometricVerified,
      manualApproved: true,
      geoCheckPassed,
      deviceFingerprint,
      ipAddress,
      userLocation,
      riskScore: await this.calculateRiskScore(amount, toAddress, userLocation)
    };
  }

  private async checkAddressRisk(address: string): Promise<boolean> {
    // This would integrate with Circle's Compliance Engine or external risk scoring
    // For now, return false as a placeholder
    return false;
  }

  private async performGeoCheck(
    userLocation: {
      country: string;
      city: string;
      latitude: number;
      longitude: number;
    },
    ipAddress?: string
  ): Promise<boolean> {
    // This would integrate with IP geolocation services
    // For now, return true as a placeholder
    return true;
  }

  private async calculateRiskScore(
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
    if (amount > 10000) riskScore += 30;
    if (amount > 25000) riskScore += 20;

    // Location-based risk
    if (userLocation) {
      const highRiskCountries = ['CY', 'MT', 'BG', 'RO'];
      if (highRiskCountries.includes(userLocation.country)) {
        riskScore += 25;
      }
    }

    // Address-based risk (would integrate with compliance engine)
    const addressRisk = await this.checkAddressRisk(toAddress);
    if (addressRisk) {
      riskScore += 40;
    }

    return Math.min(riskScore, 100);
  }

  private resetDailyLimitsIfNeeded(): void {
    const currentDate = new Date().toDateString();
    if (currentDate !== this.lastResetDate) {
      this.dailyTransactions.clear();
      this.lastResetDate = currentDate;
    }
  }

  getDailyTotal(fromAddress: string): number {
    return this.dailyTransactions.get(fromAddress) || 0;
  }

  getRecentTransactions(fromAddress: string): Array<{ amount: number; timestamp: number }> {
    return this.recentTransactions.get(fromAddress) || [];
  }

  getPendingApproval(fromAddress: string) {
    return this.pendingApprovals.get(fromAddress);
  }

  approveTransaction(fromAddress: string): boolean {
    const pending = this.pendingApprovals.get(fromAddress);
    if (pending) {
      this.pendingApprovals.delete(fromAddress);
      return true;
    }
    return false;
  }

  isEligibleForVeryHighRisk(
    amount: number,
    userCountry?: string,
    deviceFingerprint?: string
  ): boolean {
    return (
      amount >= VERY_HIGH_RISK_POLICY.minAmount &&
      amount <= VERY_HIGH_RISK_POLICY.maxAmount &&
      (!userCountry || VERY_HIGH_RISK_POLICY.allowedCountries.includes(userCountry))
    );
  }

  async verifyPasskey(credentialId: string, signature: string): Promise<boolean> {
    // This would integrate with WebAuthn/Passkey verification
    return true;
  }

  async verifyBiometric(biometricData: string): Promise<boolean> {
    // This would integrate with biometric verification
    return true;
  }
}

export const veryHighRiskApprovalService = new VeryHighRiskApprovalService();
