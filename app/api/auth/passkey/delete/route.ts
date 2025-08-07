import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { simpleWebAuthnService } from '@/lib/webauthn/simple-service';
import { z } from 'zod';

const deletePasskeySchema = z.object({
  passkeyId: z.string().min(1, 'Passkey ID is required'),
});

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    
    // Validate input
    const validationResult = deletePasskeySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { passkeyId } = validationResult.data;

    // Delete the passkey
    const result = await simpleWebAuthnService.deletePasskey(passkeyId, user.userId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to delete passkey' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Passkey deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete passkey error:', error);
    return NextResponse.json(
      { error: 'Failed to delete passkey' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 