export * from './low';
export * from './medium';
export * from './high';
export * from './very-high';
export * from './extreme';

import { lowRiskApprovalService, LOW_RISK_POLICY } from './low';
import { mediumRiskApprovalService, MEDIUM_RISK_POLICY } from './medium';
import { highRiskApprovalService, HIGH_RISK_POLICY } from './high';
import { veryHighRiskApprovalService, VERY_HIGH_RISK_POLICY } from './very-high';
import { extremeRiskApprovalService, EXTREME_RISK_POLICY } from './extreme';

export interface ApprovalRequest {
  amount: number;
  toAddress: string;
  fromAddress: string;
  userCountry?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userLocation?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  passkeyVerified?: boolean;
  passwordVerified?: boolean;
  otpCode?: string;
  manualApproved?: boolean;
}

export interface ApprovalResponse {
  approved: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'very-high' | 'extreme';
  requiresAction: boolean;
  actionRequired?: string;
  autoApproved: boolean;
  requiresPasskey: boolean;
  requiresPassword: boolean;
  requiresOTP: boolean;
  requiresBiometric: boolean;
  requiresManualApproval: boolean;
  requiresComplianceReview: boolean;
  blocked: boolean;
  blockReason?: string;
  riskScore?: number;
  nextSteps?: string[];
}

export class DynamicApprovalManager {
  async processApproval(request: ApprovalRequest): Promise<ApprovalResponse> {
    const { amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress, userLocation } = request;

    // Determine risk level based on amount
    let riskLevel: 'low' | 'medium' | 'high' | 'very-high' | 'extreme';
    
    if (amount <= LOW_RISK_POLICY.maxAmount) {
      riskLevel = 'low';
    } else if (amount <= MEDIUM_RISK_POLICY.maxAmount) {
      riskLevel = 'medium';
    } else if (amount <= HIGH_RISK_POLICY.maxAmount) {
      riskLevel = 'high';
    } else if (amount <= VERY_HIGH_RISK_POLICY.maxAmount) {
      riskLevel = 'very-high';
    } else {
      riskLevel = 'extreme';
    }

    try {
      switch (riskLevel) {
        case 'low':
          const lowResult = await lowRiskApprovalService.checkLowRiskApproval(
            amount, toAddress, fromAddress, userCountry, deviceFingerprint
          );
          return {
            approved: true,
            riskLevel: 'low',
            requiresAction: false,
            autoApproved: true,
            requiresPasskey: false,
            requiresPassword: false,
            requiresOTP: false,
            requiresBiometric: false,
            requiresManualApproval: false,
            requiresComplianceReview: false,
            blocked: false
          };

        case 'medium':
          const mediumResult = await mediumRiskApprovalService.checkMediumRiskApproval(
            amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress,
            request.passwordVerified
          );
          return {
            approved: mediumResult.passwordVerified,
            riskLevel: 'medium',
            requiresAction: !mediumResult.passwordVerified,
            actionRequired: !mediumResult.passwordVerified ? 'Password verification required' : undefined,
            autoApproved: false,
            requiresPasskey: false,
            requiresPassword: true,
            requiresOTP: false,
            requiresBiometric: false,
            requiresManualApproval: false,
            requiresComplianceReview: false,
            blocked: false,
            nextSteps: !mediumResult.passwordVerified ? ['Enter your password'] : undefined
          };

        case 'high':
          const highResult = await highRiskApprovalService.checkHighRiskApproval(
            amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress, 
            request.passkeyVerified
          );
          return {
            approved: highResult.passkeyVerified,
            riskLevel: 'high',
            requiresAction: !highResult.passkeyVerified,
            actionRequired: !highResult.passkeyVerified ? 'Passkey verification required' : undefined,
            autoApproved: false,
            requiresPasskey: true,
            requiresPassword: false,
            requiresOTP: false,
            requiresBiometric: false,
            requiresManualApproval: false,
            requiresComplianceReview: false,
            blocked: false,
            nextSteps: !highResult.passkeyVerified ? ['Complete passkey verification'] : undefined
          };

        case 'very-high':
          console.log('Processing very-high risk approval');
          console.log('Request parameters:', {
            amount,
            toAddress,
            fromAddress,
            userCountry,
            deviceFingerprint,
            ipAddress,
            passkeyVerified: request.passkeyVerified,
            otpVerified: request.otpCode ? true : false,
            otpCode: request.otpCode
          });
          
          const veryHighResult = await veryHighRiskApprovalService.checkVeryHighRiskApproval(
            amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress,
            request.passkeyVerified, request.otpCode ? true : false, request.otpCode
          );
          console.log('Very-high risk result:', veryHighResult);
          console.log('Approval manager logic:', {
            passkeyVerified: veryHighResult.passkeyVerified,
            otpVerified: veryHighResult.otpVerified,
            approved: veryHighResult.passkeyVerified && veryHighResult.otpVerified,
            requiresAction: !veryHighResult.passkeyVerified || !veryHighResult.otpVerified,
            actionRequired: !veryHighResult.passkeyVerified ? 'Passkey verification required' : 
                           !veryHighResult.otpVerified ? 'OTP verification required' : undefined
          });
          
          const response: ApprovalResponse = {
            approved: veryHighResult.passkeyVerified && veryHighResult.otpVerified,
            riskLevel: 'very-high' as const,
            requiresAction: !veryHighResult.passkeyVerified || !veryHighResult.otpVerified,
            actionRequired: !veryHighResult.passkeyVerified ? 'Passkey verification required' : 
                           !veryHighResult.otpVerified ? 'OTP verification required' : undefined,
            autoApproved: false,
            requiresPasskey: veryHighResult.requiresPasskey,
            requiresPassword: false,
            requiresOTP: veryHighResult.requiresOTP,
            requiresBiometric: false,
            requiresManualApproval: false,
            requiresComplianceReview: false,
            blocked: false,
            nextSteps: !veryHighResult.passkeyVerified ? ['Complete passkey verification'] :
                      !veryHighResult.otpVerified ? ['Check email for OTP code', 'Enter OTP code'] : undefined
          };
          console.log('Very-high risk response:', response);
          return response;

        case 'extreme':
          const extremeResult = await extremeRiskApprovalService.checkExtremeRiskApproval(
            amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress
          );
          return {
            approved: false,
            riskLevel: 'extreme',
            requiresAction: true,
            actionRequired: extremeResult.blockReason,
            autoApproved: false,
            requiresPasskey: false,
            requiresPassword: false,
            requiresOTP: false,
            requiresBiometric: false,
            requiresManualApproval: false,
            requiresComplianceReview: false,
            blocked: true,
            blockReason: extremeResult.blockReason,
            nextSteps: ['Transaction blocked for security reasons']
          };

        default:
          throw new Error('Invalid risk level');
      }
    } catch (error) {
      return {
        approved: false,
        riskLevel,
        requiresAction: true,
        actionRequired: error instanceof Error ? error.message : 'Approval failed',
        autoApproved: false,
        requiresPasskey: false,
        requiresPassword: false,
        requiresOTP: false,
        requiresBiometric: false,
        requiresManualApproval: false,
        requiresComplianceReview: false,
        blocked: true,
        blockReason: error instanceof Error ? error.message : 'Approval failed'
      };
    }
  }

  getRiskLevel(amount: number): 'low' | 'medium' | 'high' | 'very-high' | 'extreme' {
    if (amount <= LOW_RISK_POLICY.maxAmount) return 'low';
    if (amount <= MEDIUM_RISK_POLICY.maxAmount) return 'medium';
    if (amount <= HIGH_RISK_POLICY.maxAmount) return 'high';
    if (amount <= VERY_HIGH_RISK_POLICY.maxAmount) return 'very-high';
    return 'extreme';
  }

  getRiskLevelInfo(riskLevel: 'low' | 'medium' | 'high' | 'very-high' | 'extreme') {
    switch (riskLevel) {
      case 'low':
        return {
          name: 'Low Risk',
          description: 'Auto-approved transactions',
          maxAmount: LOW_RISK_POLICY.maxAmount,
          requirements: ['Amount under $1', 'Low-risk country', 'Daily limit check']
        };
      case 'medium':
        return {
          name: 'Medium Risk',
          description: 'Requires password verification',
          maxAmount: MEDIUM_RISK_POLICY.maxAmount,
          requirements: ['Password verification', 'Device verification', 'Velocity check']
        };
      case 'high':
        return {
          name: 'High Risk',
          description: 'Requires passkey verification',
          maxAmount: HIGH_RISK_POLICY.maxAmount,
          requirements: ['Passkey verification', 'Device verification', 'Address risk check']
        };
      case 'very-high':
        return {
          name: 'Very High Risk',
          description: 'Requires passkey + OTP verification',
          maxAmount: VERY_HIGH_RISK_POLICY.maxAmount,
          requirements: ['Passkey verification', 'OTP verification', 'Address risk check', 'Time restrictions']
        };
      case 'extreme':
        return {
          name: 'Extreme Risk',
          description: 'Transaction blocked for security',
          maxAmount: EXTREME_RISK_POLICY.maxAmount,
          requirements: ['All transactions blocked', 'Security restrictions', 'Compliance requirements']
        };
    }
  }
}

export const dynamicApprovalManager = new DynamicApprovalManager(); 