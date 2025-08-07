import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { PrismaClient } from '@/lib/generated/prisma';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

// USDC Contract Address on Sepolia
const USDC_SEPOLIA_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

// Minimal ERC20 ABI for USDC operations
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

async function sendUSDC(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    const { vaultId, amount, toAddress } = body;

    console.log('USDC Send Request:', {
      userId: user.userId,
      vaultId,
      amount,
      toAddress
    });

    if (!vaultId || !amount || !toAddress) {
      return NextResponse.json(
        { error: 'Vault ID, amount, and recipient address are required' },
        { status: 400 }
      );
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate recipient address
    if (!toAddress.startsWith('0x') || toAddress.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid recipient address' },
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

    // Parse the encrypted data to get the wallet information
    const vaultData = JSON.parse(vault.encryptedData);
    const walletAddress = vaultData.address;
    const privateKey = vaultData.privateKey;

    console.log('Found vault with address:', walletAddress);
    console.log('USDC Contract Address:', USDC_SEPOLIA_ADDRESS);

    // Create provider and wallet for Sepolia (server-side, no CORS issues)
    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia.publicnode.com');
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log('Wallet created with address:', wallet.address);

    const usdcContract = new ethers.Contract(USDC_SEPOLIA_ADDRESS, ERC20_ABI, wallet);

    // Get token decimals (6 for USDC)
    const decimals = await usdcContract.decimals();
    console.log('USDC decimals:', decimals);

    // Convert amount to smallest unit
    const parsedAmount = ethers.parseUnits(amount, decimals);
    console.log('Parsed amount:', parsedAmount.toString());

    // Check balance before sending
    const balance = await usdcContract.balanceOf(walletAddress);
    console.log('Current USDC balance:', ethers.formatUnits(balance, decimals));
    
    if (balance < parsedAmount) {
      return NextResponse.json(
        { error: 'Insufficient USDC balance' },
        { status: 400 }
      );
    }

    // Check ETH balance for gas fees
    const ethBalance = await provider.getBalance(walletAddress);
    console.log('Current ETH balance:', ethers.formatEther(ethBalance));
    
    if (ethBalance.toString() === '0') {
      return NextResponse.json(
        { error: 'Insufficient ETH balance for gas fees. Please get some test ETH from a Sepolia faucet.' },
        { status: 400 }
      );
    }

    console.log('Sending USDC transaction...');
    // Send transaction
    const tx = await usdcContract.transfer(toAddress, parsedAmount);
    console.log('Transaction sent, waiting for confirmation...');
    const receipt = await tx.wait();

    console.log('USDC transaction successful:', receipt.hash);

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      message: 'USDC sent successfully'
    });
  } catch (error) {
    console.error('Failed to send USDC:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to send USDC: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export const POST = withAuth(sendUSDC); 