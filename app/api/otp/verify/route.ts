import { NextRequest, NextResponse } from 'next/server';
import { otpStrategy } from '../../../../lib/approval/strategies/otp';
import { verifyAccessToken } from '../../../../lib/auth';
import { PrismaClient } from '../../../../lib/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { code, type, email, userId } = await request.json();

    if (!code || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: code and type' },
        { status: 400 }
      );
    }

    // Validate OTP type
    const validTypes = ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_VERIFICATION', 'TRANSACTION_APPROVAL'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid OTP type' },
        { status: 400 }
      );
    }

    // For demo purposes, find user by email if userId is not provided
    let actualUserId = userId;
    
    if (!actualUserId && email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (user) {
        actualUserId = user.id;
      } else {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    } else if (actualUserId) {
      // Verify the access token if userId is provided
      const accessToken = request.cookies.get('accessToken')?.value;
      
      if (accessToken) {
        const payload = verifyAccessToken(accessToken);
        if (!payload || payload.userId !== userId) {
          return NextResponse.json(
            { error: 'Unauthorized - Invalid access token' },
            { status: 401 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await otpStrategy.verifyOtp(actualUserId, code, type);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 