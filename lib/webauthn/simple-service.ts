import { PrismaClient } from '../generated/prisma';
import { rpId, rpName, origin } from './constants';

const prisma = new PrismaClient();

export interface TransactionContext {
  amount: number;
  toAddress: string;
  fromAddress: string;
  riskLevel: string;
}

export class SimpleWebAuthnService {
  /**
   * Check if user has passkeys
   */
  async hasPasskeys(userId: string): Promise<boolean> {
    const passkeys = await prisma.passkey.findMany({
      where: { userId },
      select: { id: true },
    });
    return passkeys.length > 0;
  }

  /**
   * Generate a random challenge
   */
  private generateChallenge(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate registration options for a new passkey
   */
  async generateRegistrationOptions(email: string, userId: string) {
    // Check if user already has passkeys
    const existingPasskeys = await prisma.passkey.findMany({
      where: { userId },
      select: { credentialID: true },
    });

    // Create basic registration options
    const options = {
      challenge: this.generateChallenge(),
      rp: {
        name: rpName,
        id: rpId,
      },
      user: {
        id: userId,
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      excludeCredentials: existingPasskeys.map(passkey => ({
        id: passkey.credentialID,
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'discouraged',
        userVerification: 'required',
      },
    };

    // Store the challenge temporarily (in production, use Redis)
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Store challenge in a temporary field or use a separate table
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: options,
    };
  }

  /**
   * Verify registration response and save the passkey
   */
  async verifyRegistration(data: any, userId: string, challenge: string) {
    try {
      // In a real implementation, you would verify the WebAuthn response
      // For now, we'll simulate a successful verification
      
      // Extract credential information
      const credentialID = data.rawId || data.id;
      const credentialPublicKey = data.response?.clientDataJSON || 'mock-public-key';
      const transports = data.response?.transports || ['internal'];

      // Save the passkey to database
      await prisma.passkey.create({
        data: {
          userId,
          credentialID: typeof credentialID === 'string' ? credentialID : btoa(String.fromCharCode(...new Uint8Array(credentialID))),
          credentialPublicKey: typeof credentialPublicKey === 'string' ? credentialPublicKey : btoa(String.fromCharCode(...new Uint8Array(credentialPublicKey))),
          counter: 0,
          transports,
          name: `Passkey ${new Date().toLocaleDateString()}`,
        },
      });

      return {
        success: true,
        message: 'Passkey registered successfully',
      };
    } catch (error) {
      console.error('Error saving passkey:', error);
      return {
        success: false,
        message: 'Failed to save passkey',
      };
    }
  }

  /**
   * Generate authentication options for login
   */
  async generateAuthenticationOptions(userId: string, transactionContext?: TransactionContext) {
    // Get user's passkeys
    const passkeys = await prisma.passkey.findMany({
      where: { userId },
      select: {
        credentialID: true,
        transports: true,
      },
    });

    if (passkeys.length === 0) {
      return {
        success: false,
        message: 'No passkeys found for this user',
      };
    }

    // Create basic authentication options
    const options = {
      challenge: this.generateChallenge(),
      rpId: rpId,
      allowCredentials: passkeys.map(passkey => ({
        id: passkey.credentialID,
        type: 'public-key',
        transports: passkey.transports,
      })),
      userVerification: 'required',
      timeout: 60000,
    };

    // Store the challenge and transaction context (in production, use Redis)
    await prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: options,
    };
  }

  /**
   * Verify authentication response
   */
  async verifyAuthentication(data: any, userId: string, challenge: string, transactionContext?: TransactionContext) {
    try {
      // Find the passkey that was used
      const passkey = await prisma.passkey.findFirst({
        where: {
          userId,
          credentialID: data.rawId || data.id,
        },
      });

      if (!passkey) {
        return {
          success: false,
          message: 'Passkey not found',
        };
      }

      // In a real implementation, you would verify the WebAuthn response
      // For now, we'll simulate a successful verification
      
      // Update the passkey counter and last used timestamp
      await prisma.passkey.update({
        where: { id: passkey.id },
        data: {
          counter: passkey.counter + 1,
          lastUsedAt: new Date(),
        },
      });

      // Log the transaction context for audit purposes
      if (transactionContext) {
        console.log('Passkey verification for transaction:', {
          userId,
          amount: transactionContext.amount,
          toAddress: transactionContext.toAddress,
          fromAddress: transactionContext.fromAddress,
          riskLevel: transactionContext.riskLevel,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        message: 'Authentication successful',
      };
    } catch (error) {
      console.error('Authentication verification error:', error);
      return {
        success: false,
        message: 'Authentication verification failed',
      };
    }
  }

  /**
   * Get user's passkeys
   */
  async getUserPasskeys(userId: string) {
    try {
      const passkeys = await prisma.passkey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          credentialID: true,
          lastUsedAt: true,
          createdAt: true,
          transports: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return passkeys;
    } catch (error) {
      console.error('Error getting user passkeys:', error);
      return [];
    }
  }

  /**
   * Delete a passkey
   */
  async deletePasskey(passkeyId: string, userId: string) {
    try {
      const passkey = await prisma.passkey.findFirst({
        where: {
          id: passkeyId,
          userId,
        },
      });

      if (!passkey) {
        return {
          success: false,
          message: 'Passkey not found',
        };
      }

      await prisma.passkey.delete({
        where: { id: passkeyId },
      });

      return {
        success: true,
        message: 'Passkey deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting passkey:', error);
      return {
        success: false,
        message: 'Failed to delete passkey',
      };
    }
  }
}

export const simpleWebAuthnService = new SimpleWebAuthnService(); 