import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { otpStrategy } from '@/lib/approval/strategies/otp';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

async function handler(request: NextRequest, bodyData?: any) {
  try {
    const body = bodyData || await request.json();
    const { email, type } = body;

    // If email is provided in the request body, this is a demo request
    if (email && type) {
      // Demo mode - create a consistent user ID for the demo based on email
      const demoUserId = `demo-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      console.log('Demo OTP request:', { email, type, demoUserId });
      
      // Send OTP for demo
      const result = await otpStrategy.sendOtp(
        demoUserId,
        email,
        type
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
    }

    // Real implementation - requires authentication
    const authenticatedRequest = request as AuthenticatedRequest;
    const user = authenticatedRequest.user!;
    
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

    if (!userWithEmail.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Send OTP for transaction approval using user's actual email
    console.log('Real OTP request:', { 
      userId: userWithEmail.id, 
      userEmail: userWithEmail.email 
    });
    
    const result = await otpStrategy.sendOtp(
      userWithEmail.id,
      userWithEmail.email, // Use the user's actual email
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

// Create a wrapper that handles both authenticated and unauthenticated requests
export async function POST(request: NextRequest) {
  try {
    // Try to parse the body, but handle the case where there's no body
    let body;
    let email, type;
    
    try {
      body = await request.json();
      email = body.email;
      type = body.type;
    } catch (parseError) {
      // No body provided, this is likely an authenticated request
      body = {};
      email = undefined;
      type = undefined;
    }

    // If email and type are provided, this is a demo request (no auth required)
    if (email && type) {
      return await handler(request, body);
    }

    // Otherwise, require authentication
    return await withAuth((req: NextRequest) => handler(req, body))(request);
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
} 