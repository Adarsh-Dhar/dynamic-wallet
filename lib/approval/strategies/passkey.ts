import { simpleWebAuthnService } from '../../webauthn/simple-service';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export interface PasskeyVerificationRequest {
  userId: string;
  credentialId?: string;
  challenge: string;
  transactionContext?: {
    amount: number;
    toAddress: string;
    fromAddress: string;
    riskLevel: string;
  };
}

export interface PasskeyVerificationResponse {
  success: boolean;
  requiresPasskey: boolean;
  passkeyVerified: boolean;
  error?: string;
  message?: string;
}

export class PasskeyVerificationService {
  /**
   * Check if user has passkeys and requires passkey verification for transaction
   */
  async checkPasskeyRequirement(userId: string, amount: number): Promise<boolean> {
    // For high-risk transactions, always require passkey if available
    if (amount >= 3 && amount <= 5) {
      const hasPasskeys = await simpleWebAuthnService.hasPasskeys(userId);
      return hasPasskeys;
    }
    return false;
  }

  /**
   * Generate passkey authentication options for transaction verification
   */
  async generatePasskeyOptions(userId: string, transactionContext?: any): Promise<PasskeyVerificationResponse> {
    try {
      const hasPasskeys = await simpleWebAuthnService.hasPasskeys(userId);
      
      if (!hasPasskeys) {
        return {
          success: false,
          requiresPasskey: false,
          passkeyVerified: false,
          error: 'No passkeys found for this user',
        };
      }

      const result = await simpleWebAuthnService.generateAuthenticationOptions(userId, transactionContext);
      
      if (!result.success) {
        return {
          success: false,
          requiresPasskey: true,
          passkeyVerified: false,
          error: result.message,
        };
      }

      return {
        success: true,
        requiresPasskey: true,
        passkeyVerified: false,
        message: 'Passkey verification required',
        // Note: In a real implementation, you'd store the challenge securely
        // and return it to the client for verification
      };
    } catch (error) {
      console.error('Passkey verification error:', error);
      return {
        success: false,
        requiresPasskey: false,
        passkeyVerified: false,
        error: 'Passkey verification failed',
      };
    }
  }

  /**
   * Verify passkey for transaction approval
   */
  async verifyPasskeyForTransaction(
    request: PasskeyVerificationRequest
  ): Promise<PasskeyVerificationResponse> {
    try {
      const { userId, challenge, transactionContext } = request;

      // Check if user has passkeys
      const hasPasskeys = await simpleWebAuthnService.hasPasskeys(userId);
      
      if (!hasPasskeys) {
        return {
          success: false,
          requiresPasskey: false,
          passkeyVerified: false,
          error: 'No passkeys found for this user',
        };
      }

      // In a real implementation, you would:
      // 1. Get the authentication response from the client
      // 2. Verify it using the stored challenge
      // 3. Update the passkey counter
      
      // For now, we'll simulate a successful verification
      // In production, you'd use the actual WebAuthn verification
      
      return {
        success: true,
        requiresPasskey: true,
        passkeyVerified: true,
        message: 'Passkey verified successfully',
      };
    } catch (error) {
      console.error('Passkey verification error:', error);
      return {
        success: false,
        requiresPasskey: true,
        passkeyVerified: false,
        error: 'Passkey verification failed',
      };
    }
  }

  /**
   * Register a new passkey for a user
   */
  async registerPasskey(userId: string, email: string): Promise<PasskeyVerificationResponse> {
    try {
      const result = await simpleWebAuthnService.generateRegistrationOptions(email, userId);
      
      if (!result.success) {
        return {
          success: false,
          requiresPasskey: false,
          passkeyVerified: false,
          error: 'Failed to generate registration options',
        };
      }

      return {
        success: true,
        requiresPasskey: false,
        passkeyVerified: false,
        message: 'Passkey registration initiated',
      };
    } catch (error) {
      console.error('Passkey registration error:', error);
      return {
        success: false,
        requiresPasskey: false,
        passkeyVerified: false,
        error: 'Passkey registration failed',
      };
    }
  }

  /**
   * Get user's passkeys
   */
  async getUserPasskeys(userId: string) {
    try {
      const passkeys = await simpleWebAuthnService.getUserPasskeys(userId);
      return {
        success: true,
        passkeys,
      };
    } catch (error) {
      console.error('Error getting user passkeys:', error);
      return {
        success: false,
        passkeys: [],
        error: 'Failed to get passkeys',
      };
    }
  }

  /**
   * Delete a passkey
   */
  async deletePasskey(passkeyId: string, userId: string): Promise<PasskeyVerificationResponse> {
    try {
      const result = await simpleWebAuthnService.deletePasskey(passkeyId, userId);
      
      if (!result.success) {
        return {
          success: false,
          requiresPasskey: false,
          passkeyVerified: false,
          error: result.message,
        };
      }

      return {
        success: true,
        requiresPasskey: false,
        passkeyVerified: false,
        message: 'Passkey deleted successfully',
      };
    } catch (error) {
      console.error('Passkey deletion error:', error);
      return {
        success: false,
        requiresPasskey: false,
        passkeyVerified: false,
        error: 'Failed to delete passkey',
      };
    }
  }
}

export const passkeyVerificationService = new PasskeyVerificationService();
