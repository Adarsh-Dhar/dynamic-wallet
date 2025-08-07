import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// GET /api/vaults/[id] - Get individual vault data including private key
async function getVault(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const vaultId = request.nextUrl.pathname.split('/').pop();

    if (!vaultId) {
      return NextResponse.json(
        { error: 'Vault ID is required' },
        { status: 400 }
      );
    }

    // Get the specific vault for the authenticated user
    const vault = await prisma.vault.findFirst({
      where: { 
        id: vaultId,
        userId: user.userId 
      },
      select: {
        id: true,
        label: true,
        encryptedData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      );
    }

    // Parse the encrypted data to get the full vault information
    try {
      const vaultData = JSON.parse(vault.encryptedData);
      return NextResponse.json({
        id: vault.id,
        label: vault.label,
        address: vaultData.address,
        publicKey: vaultData.publicKey,
        privateKey: vaultData.privateKey,
        mnemonic: vaultData.mnemonic,
        createdAt: vault.createdAt,
        updatedAt: vault.updatedAt,
      });
    } catch (error) {
      console.error('Error parsing vault data:', error);
      return NextResponse.json(
        { error: 'Invalid vault data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Get vault error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getVault); 