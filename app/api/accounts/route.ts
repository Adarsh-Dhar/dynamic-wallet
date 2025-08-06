import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { PrismaClient } from '@/lib/generated/prisma';
import { ethers } from 'ethers';

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
        encryptedData: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse encrypted data to get addresses
    const vaultsWithAddresses = vaults.map(vault => {
      try {
        const vaultData = JSON.parse(vault.encryptedData);
        return {
          id: vault.id,
          label: vault.label,
          address: vaultData.address,
          createdAt: vault.createdAt,
          updatedAt: vault.updatedAt,
        };
      } catch (error) {
        console.error('Error parsing vault data:', error);
        return {
          id: vault.id,
          label: vault.label,
          address: null,
          createdAt: vault.createdAt,
          updatedAt: vault.updatedAt,
        };
      }
    });

    return NextResponse.json({ vaults: vaultsWithAddresses });
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

    // Generate Ethereum keypair
    const wallet = ethers.Wallet.createRandom();
    
    // Log the keypair information
    console.log('🔐 Generated Ethereum Keypair:');
    console.log('Account Name:', label);
    console.log('Private Key:', wallet.privateKey);
    console.log('Public Key:', wallet.publicKey);
    console.log('Address:', wallet.address);
    console.log('Mnemonic:', wallet.mnemonic?.phrase);
    console.log('---');

    // Create encrypted vault data (in a real app, you'd encrypt this with user's password)
    const vaultData = {
      accountName: label,
      address: wallet.address,
      publicKey: wallet.publicKey,
      // Note: In production, you'd encrypt the private key with user's password
      // For now, we'll store it as-is (NOT recommended for production)
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
      createdAt: new Date().toISOString(),
    };

    // Create the vault in database
    const newVault = await prisma.vault.create({
      data: {
        userId: user.userId,
        label,
        encryptedData: JSON.stringify(vaultData), // Store as JSON string
      },
      select: {
        id: true,
        label: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      vault: newVault,
      address: wallet.address, // Return address for UI display
    }, { status: 201 });
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
