import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { passwordVerificationService, PasswordVerificationRequest } from '@/lib/approval/strategies/password';
import { z } from 'zod';

const verifyPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  transactionContext: z.object({
    amount: z.number().positive('Amount must be positive'),
    toAddress: z.string().min(1, 'Recipient address is required'),
    fromAddress: z.string().min(1, 'Sender address is required'),
    riskLevel: z.string().optional(),
  }).optional(),
});

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;
    const body = await request.json();
    
    // Validate input
    const validationResult = verifyPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { password, transactionContext } = validationResult.data;

    // Create password verification request
    const verificationRequest: PasswordVerificationRequest = {
      userId: user.userId,
      password,
      transactionContext: transactionContext ? {
        amount: transactionContext.amount,
        toAddress: transactionContext.toAddress,
        fromAddress: transactionContext.fromAddress,
        riskLevel: transactionContext.riskLevel || 'medium'
      } : undefined
    };

    // Verify password
    const response = await passwordVerificationService.verifyPasswordForTransaction(verificationRequest);
    
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Password verification failed' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password verified successfully',
      requiresPassword: response.requiresPassword,
      passwordVerified: response.passwordVerified
    });
  } catch (error: any) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Password verification failed' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 