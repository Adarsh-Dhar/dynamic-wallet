import { NextRequest, NextResponse } from 'next/server'
import { dynamicApprovalManager, ApprovalRequest } from '@/lib/approval'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress, userLocation, passkeyVerified, passwordVerified, otpCode, manualApproved } = body

    // Validate required fields
    if (!amount || !toAddress || !fromAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const approvalRequest: ApprovalRequest = {
      amount: parseFloat(amount),
      toAddress,
      fromAddress,
      userCountry,
      deviceFingerprint,
      ipAddress,
      userLocation,
      passkeyVerified,
      passwordVerified,
      otpCode,
      manualApproved
    }

    const approvalResponse = await dynamicApprovalManager.processApproval(approvalRequest)

    return NextResponse.json(approvalResponse)
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