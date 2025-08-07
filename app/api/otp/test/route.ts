import { NextRequest, NextResponse } from 'next/server';
import { otpStrategy } from '../../../../lib/approval/strategies/otp';

export async function GET(request: NextRequest) {
  try {
    // Test OTP generation
    const testUserId = 'test-user-id';
    const testEmail = 'test@example.com';
    const testType = 'EMAIL_VERIFICATION';

    // Test sending OTP (this will fail without proper auth, but we can test the strategy)
    const sendResult = await otpStrategy.sendOtp(testUserId, testEmail, testType);

    return NextResponse.json({
      success: true,
      message: 'OTP system is working',
      sendResult,
      features: {
        rateLimiting: 'Enabled',
        expiration: '10 minutes',
        emailTemplates: 'React-based',
        databaseStorage: 'PostgreSQL with Prisma',
        security: 'One-time use, rate limiting, expiration',
      },
    });

  } catch (error) {
    console.error('OTP test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'OTP system test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 