import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { PrismaClient } from '@/lib/generated/prisma';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

// USDC Contract Address on Sepolia
const USDC_SEPOLIA_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

// Minimal ERC20 ABI for USDC operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]

async function getUSDCBalance(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const { searchParams } = new URL(request.url);
    const vaultId = searchParams.get('vaultId');

    console.log('USDC Balance Request:', {
      userId: user.userId,
      vaultId,
      cookies: request.cookies.getAll(),
      headers: Object.fromEntries(request.headers.entries())
    });

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
        encryptedData: true,
      },
    });

    if (!vault) {
      console.log('Vault not found for user:', user.userId, 'vaultId:', vaultId);
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      );
    }

    // Parse the encrypted data to get the wallet address
    const vaultData = JSON.parse(vault.encryptedData);
    const walletAddress = vaultData.address;

    console.log('Found vault with address:', walletAddress);

    // Create provider for Sepolia (server-side, no CORS issues)
    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia.publicnode.com');
    const usdcContract = new ethers.Contract(USDC_SEPOLIA_ADDRESS, ERC20_ABI, provider);

    console.log('Checking USDC balance for address:', walletAddress);
    console.log('USDC Contract Address:', USDC_SEPOLIA_ADDRESS);

    // Get token info
    const [balance, symbol, decimals] = await Promise.all([
      usdcContract.balanceOf(walletAddress),
      usdcContract.symbol(),
      usdcContract.decimals()
    ]);

    // Convert balance to human readable format
    const formattedBalance = ethers.formatUnits(balance, decimals);

    console.log('USDC Balance Result:', {
      balance: formattedBalance,
      symbol,
      decimals: Number(decimals)
    });

    return NextResponse.json({
      balance: formattedBalance,
      symbol,
      decimals: Number(decimals)
    });
  } catch (error) {
    console.error('Failed to get USDC balance:', error);
    return NextResponse.json(
      { error: 'Failed to get USDC balance' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getUSDCBalance); 