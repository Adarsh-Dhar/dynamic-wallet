export interface HighRiskApproval {
  amount: number;
  toAddress: string;
  fromAddress: string;
  timestamp: number;
  requiresPasskey: boolean;
  requiresOTP: boolean;
  passkeyVerified: boolean;
  otpVerified: boolean;
  deviceFingerprint?: string;
  ipAddress?: string;
  emailSent?: boolean;
  otpCode?: string;
}

export interface HighRiskPolicy {
  minAmount: number;
  maxAmount: number;
  maxDailyLimit: number;
  requirePasskey: boolean;
  requireOTP: boolean;
  requireDeviceVerification: boolean;
  requireEmailConfirmation: boolean;
  allowedCountries: string[];
  velocityCheck: boolean;
  addressRiskCheck: boolean;
}

export const HIGH_RISK_POLICY: HighRiskPolicy = {
  minAmount: 3, // $3 USDC
  maxAmount: 5, // $5 USDC
  maxDailyLimit: 50, // $50 USDC per day
  requirePasskey: true,
  requireOTP: true,
  requireDeviceVerification: true,
  requireEmailConfirmation: true,
  allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'SG', 'NL', 'SE', 'CH', 'NO', 'DK', 'FI'],
  velocityCheck: true,
  addressRiskCheck: true
};

export class HighRiskApprovalService {
  private dailyTransactions: Map<string, number> = new Map();
  private lastResetDate: string = new Date().toDateString();
  private recentTransactions: Map<string, Array<{ amount: number; timestamp: number }>> = new Map();
  private pendingOTPs: Map<string, { code: string; expiresAt: number }> = new Map();

  async checkHighRiskApproval(
    amount: number,
    toAddress: string,
    fromAddress: string,
    userCountry?: string,
    deviceFingerprint?: string,
    ipAddress?: string,
    passkeyVerified: boolean = false,
    otpVerified: boolean = false,
    otpCode?: string
  ): Promise<HighRiskApproval> {
    // Reset daily limits if it's a new day
    this.resetDailyLimitsIfNeeded();

    // Check amount range
    if (amount < HIGH_RISK_POLICY.minAmount || amount > HIGH_RISK_POLICY.maxAmount) {
      throw new Error(`Amount ${amount} is outside high risk range (${HIGH_RISK_POLICY.minAmount}-${HIGH_RISK_POLICY.maxAmount})`);
    }

    // Check daily limit
    const dailyTotal = this.dailyTransactions.get(fromAddress) || 0;
    if (dailyTotal + amount > HIGH_RISK_POLICY.maxDailyLimit) {
      throw new Error(`Daily limit exceeded. Current: ${dailyTotal}, Attempting: ${amount}, Limit: ${HIGH_RISK_POLICY.maxDailyLimit}`);
    }

    // Check country restrictions
    if (userCountry && !HIGH_RISK_POLICY.allowedCountries.includes(userCountry)) {
      throw new Error(`Country ${userCountry} not allowed for high risk transactions`);
    }

    // Velocity check (multiple transactions in short time)
    if (HIGH_RISK_POLICY.velocityCheck) {
      const recent = this.recentTransactions.get(fromAddress) || [];
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentOneHour = recent.filter(t => t.timestamp > oneHourAgo);
      
      if (recentOneHour.length >= 3) {
        throw new Error('Too many high-risk transactions in the last hour. Please wait before making another transaction.');
      }
    }

    // Address risk check
    if (HIGH_RISK_POLICY.addressRiskCheck) {
      const isRiskyAddress = await this.checkAddressRisk(toAddress);
      if (isRiskyAddress) {
        throw new Error('Destination address has been flagged as high risk. Transaction blocked.');
      }
    }

    // Require passkey verification
    if (HIGH_RISK_POLICY.requirePasskey && !passkeyVerified) {
      throw new Error('Passkey verification required for high risk transactions');
    }

    // Require OTP verification
    if (HIGH_RISK_POLICY.requireOTP && !otpVerified) {
      if (otpCode) {
        const isValidOTP = await this.verifyOTP(fromAddress, otpCode);
        if (!isValidOTP) {
          throw new Error('Invalid OTP code. Please check your email and try again.');
        }
      } else {
        // Generate and send OTP
        const otpCode = await this.generateAndSendOTP(fromAddress);
        return {
          amount,
          toAddress,
          fromAddress,
          timestamp: Date.now(),
          requiresPasskey: HIGH_RISK_POLICY.requirePasskey,
          requiresOTP: HIGH_RISK_POLICY.requireOTP,
          passkeyVerified,
          otpVerified: false,
          deviceFingerprint,
          ipAddress,
          emailSent: true,
          otpCode
        };
      }
    }

    // Update tracking
    this.dailyTransactions.set(fromAddress, dailyTotal + amount);
    
    const recent = this.recentTransactions.get(fromAddress) || [];
    recent.push({ amount, timestamp: Date.now() });
    this.recentTransactions.set(fromAddress, recent.slice(-5)); // Keep last 5 transactions

    return {
      amount,
      toAddress,
      fromAddress,
      timestamp: Date.now(),
      requiresPasskey: HIGH_RISK_POLICY.requirePasskey,
      requiresOTP: HIGH_RISK_POLICY.requireOTP,
      passkeyVerified,
      otpVerified: true,
      deviceFingerprint,
      ipAddress
    };
  }

  private async checkAddressRisk(address: string): Promise<boolean> {
    // This would integrate with Circle's Compliance Engine or external risk scoring
    // For now, return false as a placeholder
    return false;
  }

  private async generateAndSendOTP(fromAddress: string): Promise<string> {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

    this.pendingOTPs.set(fromAddress, { code: otpCode, expiresAt });

    // This would integrate with your email service
    // await sendEmail(fromAddress, `Your OTP code is: ${otpCode}`);

    return otpCode;
  }

  private async verifyOTP(fromAddress: string, otpCode: string): Promise<boolean> {
    const pendingOTP = this.pendingOTPs.get(fromAddress);
    
    if (!pendingOTP) {
      return false;
    }

    if (Date.now() > pendingOTP.expiresAt) {
      this.pendingOTPs.delete(fromAddress);
      return false;
    }

    if (pendingOTP.code === otpCode) {
      this.pendingOTPs.delete(fromAddress);
      return true;
    }

    return false;
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

  isEligibleForHighRisk(
    amount: number,
    userCountry?: string,
    deviceFingerprint?: string
  ): boolean {
    return (
      amount >= HIGH_RISK_POLICY.minAmount &&
      amount <= HIGH_RISK_POLICY.maxAmount &&
      (!userCountry || HIGH_RISK_POLICY.allowedCountries.includes(userCountry))
    );
  }

  async verifyPasskey(credentialId: string, signature: string): Promise<boolean> {
    // This would integrate with WebAuthn/Passkey verification
    return true;
  }
}

export const highRiskApprovalService = new HighRiskApprovalService();
