import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { simpleWebAuthnService } from '@/lib/webauthn/simple-service';
import { z } from 'zod';

const verifyPasskeySchema = z.object({
  credential: z.any(), // WebAuthn credential response
  challenge: z.string().min(1, 'Challenge is required'),
});

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    
    // Validate input
    const validationResult = verifyPasskeySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { credential, challenge } = validationResult.data;

    // Verify the passkey
    const result = await simpleWebAuthnService.verifyRegistration(credential, user.userId, challenge);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Passkey verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Passkey verified successfully'
    });
  } catch (error: any) {
    console.error('Passkey verification error:', error);
    return NextResponse.json(
      { error: 'Passkey verification failed' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 