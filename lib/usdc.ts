import { ethers } from 'ethers'
import './types'

// USDC Contract Address on Sepolia (updated to correct address)
const USDC_SEPOLIA_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

export interface USDCBalance {
  balance: string
  symbol: string
  decimals: number
}

export interface VaultData {
  accountName: string
  address: string
  publicKey: string
  privateKey: string
  mnemonic?: string
  createdAt: string
}

// Helper function to refresh access token
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    
    return response.ok
  } catch (error) {
    console.error('Failed to refresh token:', error)
    return false
  }
}

// Helper function to make authenticated requests with automatic token refresh
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  })

  // If we get a 401, try to refresh the token and retry once
  if (response.status === 401) {
    const refreshSuccess = await refreshAccessToken()
    if (refreshSuccess) {
      // Retry the original request
      return fetch(url, {
        ...options,
        credentials: 'include',
      })
    }
  }

  return response
}

// Get vault data from the API
async function getVaultData(vaultId: string): Promise<VaultData | null> {
  try {
    const response = await makeAuthenticatedRequest(`/api/vaults/${vaultId}`)
    
    if (response.ok) {
      const vaultData = await response.json()
      return {
        accountName: vaultData.label,
        address: vaultData.address,
        publicKey: vaultData.publicKey,
        privateKey: vaultData.privateKey,
        mnemonic: vaultData.mnemonic,
        createdAt: vaultData.createdAt,
      }
    }
    return null
  } catch (error) {
    console.error('Failed to get vault data:', error)
    return null
  }
}

export async function getUSDCBalance(vaultId: string): Promise<USDCBalance | null> {
  try {
    const response = await makeAuthenticatedRequest(`/api/usdc/balance?vaultId=${vaultId}`)
    
    if (response.ok) {
      const data = await response.json()
      return {
        balance: data.balance,
        symbol: data.symbol,
        decimals: data.decimals
      }
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get USDC balance')
    }
  } catch (error) {
    console.error('Failed to get USDC balance:', error)
    return null
  }
}

export async function sendUSDC(vaultId: string, amount: string, toAddress: string): Promise<string> {
  try {
    const response = await makeAuthenticatedRequest('/api/usdc/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vaultId,
        amount,
        toAddress
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.transactionHash
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to send USDC')
    }
  } catch (error) {
    console.error('Failed to send USDC:', error)
    throw error
  }
}

// These functions are no longer needed since we're using server-side endpoints
export async function checkNetwork(): Promise<boolean> {
  // Always return true since we're using server-side endpoints
  return true
}

export async function switchToSepolia(): Promise<void> {
  // No-op since we're using server-side endpoints
  console.log('Using server-side Sepolia RPC connection')
} 