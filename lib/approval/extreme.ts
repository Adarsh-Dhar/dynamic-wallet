export interface ExtremeRiskApproval {
  amount: number;
  toAddress: string;
  fromAddress: string;
  timestamp: number;
  blocked: boolean;
  blockReason: string;
  deviceFingerprint?: string;
  ipAddress?: string;
}

export interface ExtremeRiskPolicy {
  minAmount: number;
  maxAmount: number;
  requireDeviceVerification: boolean;
  blockedCountries: string[];
  blockedAddresses: string[];
  velocityCheck: boolean;
  timeBasedRestrictions: boolean;
}

export const EXTREME_RISK_POLICY: ExtremeRiskPolicy = {
  minAmount: 7, // $7 USDC
  maxAmount: 9, // $9 USDC
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

  async checkExtremeRiskApproval(
    amount: number,
    toAddress: string,
    fromAddress: string,
    userCountry?: string,
    deviceFingerprint?: string,
    ipAddress?: string
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
        deviceFingerprint,
        ipAddress
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
        deviceFingerprint,
        ipAddress
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
          deviceFingerprint,
          ipAddress
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
          deviceFingerprint,
          ipAddress
        };
      }
    }

    // Always block extreme risk transactions
    return {
      amount,
      toAddress,
      fromAddress,
      timestamp: Date.now(),
      blocked: true,
      blockReason: 'Extreme risk transactions are blocked for security reasons',
      deviceFingerprint,
      ipAddress
    };
  }

  getRecentTransactions(fromAddress: string): Array<{ amount: number; timestamp: number }> {
    return this.recentTransactions.get(fromAddress) || [];
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
}

export const extremeRiskApprovalService = new ExtremeRiskApprovalService();
