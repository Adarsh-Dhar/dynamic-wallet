import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { simpleWebAuthnService } from '@/lib/webauthn/simple-service';

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;

    // Get user's passkeys
    const passkeys = await simpleWebAuthnService.getUserPasskeys(user.userId);

    return NextResponse.json({
      success: true,
      passkeys,
      message: 'Passkeys retrieved successfully'
    });
  } catch (error: any) {
    console.error('Get passkeys error:', error);
    return NextResponse.json(
      { error: 'Failed to get passkeys' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler); 