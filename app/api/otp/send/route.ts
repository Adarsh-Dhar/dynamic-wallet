import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { otpStrategy } from '@/lib/approval/strategies/otp';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    
    // Get user with email
    const userWithEmail = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!userWithEmail) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Send OTP for transaction approval
    const result = await otpStrategy.sendOtp(
      userWithEmail.id,
      userWithEmail.email,
      'TRANSACTION_APPROVAL'
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'OTP code sent successfully',
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP code' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 