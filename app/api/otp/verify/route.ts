import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { otpStrategy } from '@/lib/approval/strategies/otp';

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'OTP code is required' },
        { status: 400 }
      );
    }

    // Verify OTP for transaction approval
    const result = await otpStrategy.verifyOtp(
      user.userId,
      code,
      'TRANSACTION_APPROVAL'
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'OTP code verified successfully',
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP code' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 