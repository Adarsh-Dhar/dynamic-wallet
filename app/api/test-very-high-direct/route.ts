import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { veryHighRiskApprovalService } from '@/lib/approval/very-high';

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    const { amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress, passkeyVerified, otpCode } = body;

    console.log('Direct very high risk test:', {
      userId: user.userId,
      amount,
      toAddress,
      fromAddress,
      passkeyVerified,
      otpCode: otpCode ? 'provided' : 'not provided'
    });

    // Test the very high risk service directly
    const result = await veryHighRiskApprovalService.checkVeryHighRiskApproval(
      amount,
      toAddress,
      fromAddress,
      userCountry,
      deviceFingerprint,
      ipAddress,
      passkeyVerified,
      otpCode ? true : false,
      otpCode
    );

    console.log('Direct very high risk result:', result);

    return NextResponse.json({
      success: true,
      result,
      debug: {
        passkeyVerified,
        otpCode: otpCode ? 'provided' : 'not provided',
        otpVerified: otpCode ? true : false
      }
    });
  } catch (error: any) {
    console.error('Direct very high risk test error:', error);
    return NextResponse.json(
      { error: error.message || 'Direct test failed' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 