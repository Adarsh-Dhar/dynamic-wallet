import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function testAuth(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    
    console.log('Test Auth - User authenticated:', {
      userId: user.userId,
      email: user.email,
      cookies: request.cookies.getAll(),
      headers: Object.fromEntries(request.headers.entries())
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email
      },
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(testAuth); 