export interface LowRiskApproval {
  amount: number;
  toAddress: string;
  fromAddress: string;
  timestamp: number;
  autoApproved: boolean;
}

export interface LowRiskPolicy {
  maxAmount: number;
  maxDailyLimit: number;
  allowedCountries: string[];
  requireDeviceVerification: boolean;
}

export const LOW_RISK_POLICY: LowRiskPolicy = {
  maxAmount: 1, // $1 USDC
  maxDailyLimit: 5, // $5 USDC per day
  allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'SG'], // Low-risk countries
  requireDeviceVerification: false
};

export class LowRiskApprovalService {
  private dailyTransactions: Map<string, number> = new Map();
  private lastResetDate: string = new Date().toDateString();

  async checkLowRiskApproval(
    amount: number,
    toAddress: string,
    fromAddress: string,
    userCountry?: string,
    deviceFingerprint?: string
  ): Promise<LowRiskApproval> {
    // Reset daily limits if it's a new day
    this.resetDailyLimitsIfNeeded();

    // Check if amount is within low risk threshold
    if (amount > LOW_RISK_POLICY.maxAmount) {
      throw new Error(`Amount ${amount} exceeds low risk threshold of ${LOW_RISK_POLICY.maxAmount}`);
    }

    // Check daily limit
    const dailyTotal = this.dailyTransactions.get(fromAddress) || 0;
    if (dailyTotal + amount > LOW_RISK_POLICY.maxDailyLimit) {
      throw new Error(`Daily limit exceeded. Current: ${dailyTotal}, Attempting: ${amount}, Limit: ${LOW_RISK_POLICY.maxDailyLimit}`);
    }

    // Check country restrictions
    if (userCountry && !LOW_RISK_POLICY.allowedCountries.includes(userCountry)) {
      throw new Error(`Country ${userCountry} not allowed for low risk transactions`);
    }

    // Update daily transaction total
    this.dailyTransactions.set(fromAddress, dailyTotal + amount);

    return {
      amount,
      toAddress,
      fromAddress,
      timestamp: Date.now(),
      autoApproved: true
    };
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

  isEligibleForLowRisk(
    amount: number,
    userCountry?: string,
    deviceFingerprint?: string
  ): boolean {
    return (
      amount <= LOW_RISK_POLICY.maxAmount &&
      (!userCountry || LOW_RISK_POLICY.allowedCountries.includes(userCountry))
    );
  }
}

export const lowRiskApprovalService = new LowRiskApprovalService();
