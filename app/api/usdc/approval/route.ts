import { NextRequest, NextResponse } from 'next/server'
import { dynamicApprovalManager, ApprovalRequest } from '@/lib/approval'
import { passkeyVerificationService } from '@/lib/approval/strategies/passkey'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json()
    const { amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress, userLocation, passkeyVerified, passwordVerified, otpCode, manualApproved } = body

    // Validate required fields
    if (!amount || !toAddress || !fromAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if passkey verification is required for this transaction
    const requiresPasskey = await passkeyVerificationService.checkPasskeyRequirement(user.userId, amount);

    const approvalRequest: ApprovalRequest = {
      amount: parseFloat(amount),
      toAddress,
      fromAddress,
      userCountry,
      deviceFingerprint,
      ipAddress,
      userLocation,
      passkeyVerified: requiresPasskey ? passkeyVerified : false,
      passwordVerified,
      otpCode,
      manualApproved
    }

    const approvalResponse = await dynamicApprovalManager.processApproval(approvalRequest)

    // If passkey is required but not verified, return passkey requirement
    if (requiresPasskey && !passkeyVerified) {
      return NextResponse.json({
        ...approvalResponse,
        requiresPasskey: true,
        passkeyVerified: false,
        message: 'Passkey verification required for this transaction'
      })
    }

    return NextResponse.json({
      ...approvalResponse,
      requiresPasskey,
      passkeyVerified
    })
  } catch (error: any) {
    console.error('Approval API error:', error)
    return NextResponse.json(
      { error: error.message || 'Approval failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const amount = searchParams.get('amount')
    
    if (!amount) {
      return NextResponse.json(
        { error: 'Amount parameter required' },
        { status: 400 }
      )
    }

    const riskLevel = dynamicApprovalManager.getRiskLevel(parseFloat(amount))
    const riskInfo = dynamicApprovalManager.getRiskLevelInfo(riskLevel)

    return NextResponse.json({
      riskLevel,
      riskInfo,
      amount: parseFloat(amount)
    })
  } catch (error: any) {
    console.error('Risk level API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get risk level' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler) 