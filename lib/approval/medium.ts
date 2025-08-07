import { passwordVerificationService, PasswordVerificationRequest } from './strategies/password';

export interface MediumRiskApproval {
  amount: number;
  toAddress: string;
  fromAddress: string;
  timestamp: number;
  requiresPassword: boolean;
  passwordVerified: boolean;
  deviceFingerprint?: string;
  ipAddress?: string;
}

export interface MediumRiskPolicy {
  minAmount: number;
  maxAmount: number;
  maxDailyLimit: number;
  requirePassword: boolean;
  requireDeviceVerification: boolean;
  allowedCountries: string[];
  velocityCheck: boolean;
}

export const MEDIUM_RISK_POLICY: MediumRiskPolicy = {
  minAmount: 1, // $1 USDC
  maxAmount: 3, // $3 USDC
  maxDailyLimit: 20, // $20 USDC per day
  requirePassword: true,
  requireDeviceVerification: true,
  allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'SG', 'NL', 'SE', 'CH'],
  velocityCheck: true
};

export class MediumRiskApprovalService {
  private dailyTransactions: Map<string, number> = new Map();
  private lastResetDate: string = new Date().toDateString();
  private recentTransactions: Map<string, Array<{ amount: number; timestamp: number }>> = new Map();

  async checkMediumRiskApproval(
    amount: number,
    toAddress: string,
    fromAddress: string,
    userCountry?: string,
    deviceFingerprint?: string,
    ipAddress?: string,
    passwordVerified: boolean = false,
    userId?: string
  ): Promise<MediumRiskApproval> {
    // Reset daily limits if it's a new day
    this.resetDailyLimitsIfNeeded();

    // Check amount range
    if (amount < MEDIUM_RISK_POLICY.minAmount || amount > MEDIUM_RISK_POLICY.maxAmount) {
      throw new Error(`Amount ${amount} is outside medium risk range (${MEDIUM_RISK_POLICY.minAmount}-${MEDIUM_RISK_POLICY.maxAmount})`);
    }

    // Check daily limit
    const dailyTotal = this.dailyTransactions.get(fromAddress) || 0;
    if (dailyTotal + amount > MEDIUM_RISK_POLICY.maxDailyLimit) {
      throw new Error(`Daily limit exceeded. Current: ${dailyTotal}, Attempting: ${amount}, Limit: ${MEDIUM_RISK_POLICY.maxDailyLimit}`);
    }

    // Check country restrictions
    if (userCountry && !MEDIUM_RISK_POLICY.allowedCountries.includes(userCountry)) {
      throw new Error(`Country ${userCountry} not allowed for medium risk transactions`);
    }

    // Velocity check (multiple transactions in short time)
    if (MEDIUM_RISK_POLICY.velocityCheck) {
      const recent = this.recentTransactions.get(fromAddress) || [];
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentOneHour = recent.filter(t => t.timestamp > oneHourAgo);
      
      if (recentOneHour.length >= 5) {
        throw new Error('Too many transactions in the last hour. Please wait before making another transaction.');
      }
    }

    // Return response indicating password verification status
    // Don't throw error for password verification requirement - let the approval system handle it
    return {
      amount,
      toAddress,
      fromAddress,
      timestamp: Date.now(),
      requiresPassword: MEDIUM_RISK_POLICY.requirePassword,
      passwordVerified,
      deviceFingerprint,
      ipAddress
    };
  }

  /**
   * Update transaction tracking after successful password verification
   */
  updateTransactionTracking(fromAddress: string, amount: number): void {
    // Update daily tracking
    const dailyTotal = this.dailyTransactions.get(fromAddress) || 0;
    this.dailyTransactions.set(fromAddress, dailyTotal + amount);
    
    // Update recent transactions tracking
    const recent = this.recentTransactions.get(fromAddress) || [];
    recent.push({ amount, timestamp: Date.now() });
    this.recentTransactions.set(fromAddress, recent.slice(-10)); // Keep last 10 transactions
  }

  /**
   * Verify password for medium risk transactions
   */
  async verifyPasswordForTransaction(
    userId: string,
    password: string,
    transactionContext: {
      amount: number;
      toAddress: string;
      fromAddress: string;
    }
  ): Promise<boolean> {
    const request: PasswordVerificationRequest = {
      userId,
      password,
      transactionContext: {
        ...transactionContext,
        riskLevel: 'medium'
      }
    };

    const response = await passwordVerificationService.verifyPasswordForTransaction(request);
    return response.success && response.passwordVerified;
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

  isEligibleForMediumRisk(
    amount: number,
    userCountry?: string,
    deviceFingerprint?: string
  ): boolean {
    return (
      amount >= MEDIUM_RISK_POLICY.minAmount &&
      amount <= MEDIUM_RISK_POLICY.maxAmount &&
      (!userCountry || MEDIUM_RISK_POLICY.allowedCountries.includes(userCountry))
    );
  }

  /**
   * Get password requirements for medium risk transactions
   */
  getPasswordRequirements(): {
    required: boolean;
    reason: string;
    additionalFactors?: string[];
  } {
    return passwordVerificationService.getPasswordRequirements('medium', MEDIUM_RISK_POLICY.maxAmount);
  }

  /**
   * Get UI configuration for password verification
   */
  getPasswordUIConfig(): {
    title: string;
    description: string;
    placeholder: string;
    showTransactionDetails: boolean;
    icon: string;
  } {
    return passwordVerificationService.getPasswordUIConfig('medium', MEDIUM_RISK_POLICY.maxAmount);
  }
}

export const mediumRiskApprovalService = new MediumRiskApprovalService();
