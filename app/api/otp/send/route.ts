import { NextRequest, NextResponse } from 'next/server';
import { otpStrategy } from '../../../../lib/approval/strategies/otp';
import { PrismaClient } from '../../../../lib/generated/prisma';
import { verifyAccessToken } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { type, email, userId } = await request.json();

    if (!type || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: type and email' },
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

    // For demo purposes, create a temporary user if userId is provided
    let actualUserId = userId;
    
    if (!actualUserId) {
      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        actualUserId = existingUser.id;
      } else {
        // For demo, create a temporary user
        const tempUser = await prisma.user.create({
          data: {
            email,
            passwordHash: 'temp-hash-for-demo',
          },
        });
        actualUserId = tempUser.id;
      }
    } else {
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
    }

    // Send OTP
    const result = await otpStrategy.sendOtp(actualUserId, email, type);

    if (!result.success) {
      // Log the error message for debugging
      console.error('OTP send error:', result.message);
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
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 