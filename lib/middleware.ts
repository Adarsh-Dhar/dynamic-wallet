import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './auth';
import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
  };
}

export async function authenticateToken(
  request: NextRequest
): Promise<NextResponse | { user: { userId: string; email: string } }> {
  // Check for access token in cookies first
  const accessToken = request.cookies.get('accessToken')?.value;
  
  // Fallback to Authorization header for API calls
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  const token = accessToken || headerToken;

  if (!token) {
    return NextResponse.json(
      { error: 'Access token required' },
      { status: 401 }
    );
  }

  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Verify user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    );
  }

  return { user: { userId: user.id, email: user.email } };
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const authResult = await authenticateToken(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authResult.user;
    
    return handler(authenticatedRequest);
  };
} 