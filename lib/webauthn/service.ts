import {
  GenerateAuthenticationOptionsOpts,
  GenerateRegistrationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  VerifyRegistrationResponseOpts,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/typescript-types';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { PrismaClient } from '../generated/prisma';
import { rpId, rpName, origin, webAuthnOptions } from './constants';

const prisma = new PrismaClient();

export interface TransactionContext {
  amount: number;
  toAddress: string;
  fromAddress: string;
  riskLevel: string;
}

export interface PasskeyData {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  transports: string[];
  name?: string;
}

export class WebAuthnService {
  /**
   * Generate registration options for a new passkey
   */
  async generateRegistrationOptions(email: string, userId: string) {
    // Check if user already has passkeys
    const existingPasskeys = await prisma.passkey.findMany({
      where: { userId },
      select: { credentialID: true },
    });

    const opts: GenerateRegistrationOptionsOpts = {
      rpName,
      rpID: rpId,
      userID: Buffer.from(userId, 'utf8'),
      userName: email,
      timeout: webAuthnOptions.timeout,
      attestationType: webAuthnOptions.attestationType,
      excludeCredentials: existingPasskeys.map((passkey: { credentialID: string }) => ({
        id: isoBase64URL.toBuffer(passkey.credentialID),
        type: 'public-key' as const,
      })),
      authenticatorSelection: webAuthnOptions.authenticatorSelection,
      supportedAlgorithmIDs: webAuthnOptions.supportedAlgorithmIDs,
    };

    const options = await generateRegistrationOptions(opts);

    // Store the challenge in the database (you might want to use Redis for this in production)
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Store challenge temporarily (you might want a separate table for this)
        updatedAt: new Date(), // This is just a placeholder, you'd store the challenge properly
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
  async verifyRegistration(
    data: RegistrationResponseJSON,
    userId: string,
    challenge: string
  ) {
    const expectedChallenge = challenge;

    const opts: VerifyRegistrationResponseOpts = {
      response: data,
      expectedChallenge: expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpId,
      requireUserVerification: false,
    };

    const verification = await verifyRegistrationResponse(opts);
    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return {
        success: false,
        message: 'Registration verification failed',
      };
    }

    // Access the credential information from the registration info
    const credentialID = registrationInfo.credential.id;
    const credentialPublicKey = registrationInfo.credential.publicKey;
    const counter = registrationInfo.counter;

    // Save the passkey to database
    try {
      await prisma.passkey.create({
        data: {
          userId,
          credentialID: isoBase64URL.fromBuffer(credentialID),
          credentialPublicKey: isoBase64URL.fromBuffer(credentialPublicKey),
          counter,
          transports: data.response.transports || [],
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

    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: webAuthnOptions.timeout,
      allowCredentials: passkeys.map((passkey: { credentialID: string; transports: string[] }) => ({
        id: isoBase64URL.toBuffer(passkey.credentialID),
        type: 'public-key' as const,
        transports: passkey.transports as any,
      })),
      userVerification: 'required',
      rpID: rpId,
    };

    const options = await generateAuthenticationOptions(opts);

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
  async verifyAuthentication(
    data: AuthenticationResponseJSON,
    userId: string,
    challenge: string,
    transactionContext?: TransactionContext
  ) {
    // Find the passkey that was used
    const passkey = await prisma.passkey.findFirst({
      where: {
        userId,
        credentialID: data.rawId,
      },
    });

    if (!passkey) {
      return {
        success: false,
        message: 'Passkey not found',
      };
    }

    const opts: VerifyAuthenticationResponseOpts = {
      response: data,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpId,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(passkey.credentialID),
        credentialPublicKey: isoBase64URL.toBuffer(passkey.credentialPublicKey),
        counter: passkey.counter,
      },
      requireUserVerification: true,
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (verification.verified) {
      // Update the passkey counter and last used timestamp
      await prisma.passkey.update({
        where: { id: passkey.id },
        data: {
          counter: verification.authenticationInfo.newCounter,
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
    }

    return {
      success: false,
      message: 'Authentication verification failed',
    };
  }

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

export const webAuthnService = new WebAuthnService(); 