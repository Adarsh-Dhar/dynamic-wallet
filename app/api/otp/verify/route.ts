import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { otpStrategy } from '@/lib/approval/strategies/otp';

async function handler(request: NextRequest, bodyData?: any) {
  try {
    const body = bodyData || await request.json();
    const { code, email, type } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'OTP code is required' },
        { status: 400 }
      );
    }

    // If email and type are provided, this is a demo request
    if (email && type) {
      // Demo mode - create a consistent user ID for the demo based on email
      const demoUserId = `demo-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      console.log('Demo OTP verification:', { email, type, demoUserId });
      
      // Verify OTP for demo
      const result = await otpStrategy.verifyOtp(
        demoUserId,
        code,
        type
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
    }

    // Real implementation - requires authentication
    const authenticatedRequest = request as AuthenticatedRequest;
    const user = authenticatedRequest.user!;

    console.log('Real OTP verification:', { 
      userId: user.userId, 
      code: code.substring(0, 2) + '****' // Log partial code for security
    });

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

// Create a wrapper that handles both authenticated and unauthenticated requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type } = body;

    // If email and type are provided, this is a demo request (no auth required)
    if (email && type) {
      return await handler(request, body);
    }

    // Otherwise, require authentication
    return await withAuth((req: NextRequest) => handler(req, body))(request);
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
} 