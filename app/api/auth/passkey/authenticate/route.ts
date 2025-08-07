import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { simpleWebAuthnService } from '@/lib/webauthn/simple-service';
import { z } from 'zod';

const authenticatePasskeySchema = z.object({
  credential: z.any().optional(), // WebAuthn credential response
  challenge: z.string().optional(), // Challenge for verification
  transactionContext: z.object({
    amount: z.number(),
    toAddress: z.string(),
    fromAddress: z.string(),
    riskLevel: z.string(),
  }).optional(),
});

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    
    // Validate input
    const validationResult = authenticatePasskeySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { credential, challenge, transactionContext } = validationResult.data;

    // If no credential provided, generate authentication options
    if (!credential || !challenge) {
      const result = await simpleWebAuthnService.generateAuthenticationOptions(
        user.userId, 
        transactionContext
      );
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.message || 'Failed to generate authentication options' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Authentication options generated successfully'
      });
    }

    // Verify the authentication
    const result = await simpleWebAuthnService.verifyAuthentication(
      credential, 
      user.userId, 
      challenge,
      transactionContext
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Passkey authentication failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Passkey authenticated successfully'
    });
  } catch (error: any) {
    console.error('Passkey authentication error:', error);
    return NextResponse.json(
      { error: 'Passkey authentication failed' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 