import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// GET /api/accounts - Get all vaults for the authenticated user
async function getAccounts(request: AuthenticatedRequest) {
  try {
    const user = request.user!;

    const vaults = await prisma.vault.findMany({
      where: { userId: user.userId },
      select: {
        id: true,
        label: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ vaults });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create a new vault for the authenticated user
async function createAccount(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    const { label = 'New Wallet' } = body;

    // For now, we'll create a vault with empty encrypted data
    // In a real implementation, this would contain encrypted wallet data
    const newVault = await prisma.vault.create({
      data: {
        userId: user.userId,
        label,
        encryptedData: '{}', // Empty encrypted data for now
      },
      select: {
        id: true,
        label: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ vault: newVault }, { status: 201 });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAccounts);
export const POST = withAuth(createAccount);
