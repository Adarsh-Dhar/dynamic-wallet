export interface VeryHighRiskApproval {
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

export interface VeryHighRiskPolicy {
  minAmount: number;
  maxAmount: number;
  maxDailyLimit: number;
  requirePasskey: boolean;
  requireOTP: boolean;
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
  requireOTP: true,
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
  private pendingOTPs: Map<string, { code: string; expiresAt: number }> = new Map();

  async checkVeryHighRiskApproval(
    amount: number,
    toAddress: string,
    fromAddress: string,
    userCountry?: string,
    deviceFingerprint?: string,
    ipAddress?: string,
    passkeyVerified: boolean = false,
    otpVerified: boolean = false,
    otpCode?: string
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

    // Require passkey verification
    if (VERY_HIGH_RISK_POLICY.requirePasskey && !passkeyVerified) {
      throw new Error('Passkey verification required for very high risk transactions');
    }

    // Require OTP verification
    if (VERY_HIGH_RISK_POLICY.requireOTP && !otpVerified) {
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
          requiresPasskey: VERY_HIGH_RISK_POLICY.requirePasskey,
          requiresOTP: VERY_HIGH_RISK_POLICY.requireOTP,
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
    this.recentTransactions.set(fromAddress, recent.slice(-3)); // Keep last 3 transactions

    return {
      amount,
      toAddress,
      fromAddress,
      timestamp: Date.now(),
      requiresPasskey: VERY_HIGH_RISK_POLICY.requirePasskey,
      requiresOTP: VERY_HIGH_RISK_POLICY.requireOTP,
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
}

export const veryHighRiskApprovalService = new VeryHighRiskApprovalService();
