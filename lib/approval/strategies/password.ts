import { PrismaClient } from '@/lib/generated/prisma';
import { verifyPassword } from '@/lib/auth';

const prisma = new PrismaClient();

export interface PasswordVerificationRequest {
  userId: string;
  password: string;
  transactionContext?: {
    amount: number;
    toAddress: string;
    fromAddress: string;
    riskLevel: string;
  };
}

export interface PasswordVerificationResponse {
  success: boolean;
  error?: string;
  requiresPassword: boolean;
  passwordVerified: boolean;
}

export class PasswordVerificationService {
  /**
   * Verify a user's password for transaction approval
   */
  async verifyPasswordForTransaction(
    request: PasswordVerificationRequest
  ): Promise<PasswordVerificationResponse> {
    try {
      const { userId, password, transactionContext } = request;

      // Get user's password hash from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          passwordHash: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          requiresPassword: true,
          passwordVerified: false,
        };
      }

      // Verify password using bcrypt
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid password',
          requiresPassword: true,
          passwordVerified: false,
        };
      }

      // Log successful verification for audit purposes
      if (transactionContext) {
        console.log('Password verification successful for transaction:', {
          userId,
          amount: transactionContext.amount,
          toAddress: transactionContext.toAddress,
          riskLevel: transactionContext.riskLevel,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        requiresPassword: true,
        passwordVerified: true,
      };
    } catch (error: any) {
      console.error('Password verification error:', error);
      return {
        success: false,
        error: 'Password verification failed',
        requiresPassword: true,
        passwordVerified: false,
      };
    }
  }

  /**
   * Check if password verification is required for a transaction
   */
  isPasswordRequired(riskLevel: string, amount: number): boolean {
    // Medium risk transactions always require password
    if (riskLevel === 'medium') {
      return true;
    }

    // High risk transactions may require password in addition to other factors
    if (riskLevel === 'high' && amount > 10) {
      return true;
    }

    // Very high and extreme risk transactions require password
    if (riskLevel === 'very-high' || riskLevel === 'extreme') {
      return true;
    }

    return false;
  }

  /**
   * Get password verification requirements for a transaction
   */
  getPasswordRequirements(riskLevel: string, amount: number): {
    required: boolean;
    reason: string;
    additionalFactors?: string[];
  } {
    const required = this.isPasswordRequired(riskLevel, amount);

    if (!required) {
      return {
        required: false,
        reason: 'Password not required for this transaction level',
      };
    }

    let reason = '';
    const additionalFactors: string[] = [];

    switch (riskLevel) {
      case 'medium':
        reason = 'Medium risk transactions require password verification for security';
        break;
      case 'high':
        reason = 'High value transactions require password verification';
        additionalFactors.push('Passkey verification may also be required');
        break;
      case 'very-high':
        reason = 'Very high value transactions require password verification';
        additionalFactors.push('Additional verification methods may be required');
        break;
      case 'extreme':
        reason = 'Extreme value transactions require password verification';
        additionalFactors.push('Manual approval may be required');
        break;
      default:
        reason = 'Password verification required for security';
    }

    return {
      required: true,
      reason,
      additionalFactors,
    };
  }

  /**
   * Validate password strength (for new password creation)
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      suggestions.push('Consider adding a special character for better security');
    }

    if (password.length < 12) {
      suggestions.push('Consider using a longer password (12+ characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
    };
  }

  /**
   * Get password verification UI configuration
   */
  getPasswordUIConfig(riskLevel: string, amount: number): {
    title: string;
    description: string;
    placeholder: string;
    showTransactionDetails: boolean;
    icon: string;
  } {
    const requirements = this.getPasswordRequirements(riskLevel, amount);

    return {
      title: 'Verify Password',
      description: requirements.reason,
      placeholder: 'Enter your password',
      showTransactionDetails: true,
      icon: '🔐',
    };
  }
}

// Export singleton instance
export const passwordVerificationService = new PasswordVerificationService();
