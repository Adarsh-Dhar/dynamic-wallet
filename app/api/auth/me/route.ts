import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;

    // Get user with vaults
    const userWithVaults = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        vaults: {
          select: {
            id: true,
            label: true,
            createdAt: true,
          },
        },
      },
    });

    if (!userWithVaults) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: userWithVaults,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler); 