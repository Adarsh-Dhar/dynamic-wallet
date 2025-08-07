import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { simpleWebAuthnService } from '@/lib/webauthn/simple-service';
import { z } from 'zod';

const registerPasskeySchema = z.object({
  email: z.string().email('Invalid email address'),
});

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    
    // Validate input
    const validationResult = registerPasskeySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Generate registration options
    const result = await simpleWebAuthnService.generateRegistrationOptions(email, user.userId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to generate registration options' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Registration options generated successfully'
    });
  } catch (error: any) {
    console.error('Passkey registration error:', error);
    return NextResponse.json(
      { error: 'Passkey registration failed' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 