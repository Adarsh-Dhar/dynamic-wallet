import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { verifyPassword } from '@/lib/auth';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { z } from 'zod';

const prisma = new PrismaClient();

const verifyPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

async function handler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = verifyPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;
    const user = request.user!;

    // Get user's password hash from database
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        passwordHash: true,
      },
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, userRecord.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Password verified successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Password verification failed' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 