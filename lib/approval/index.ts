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
  biometricVerified?: boolean;
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
  requiresOTP: boolean;
  requiresBiometric: boolean;
  requiresManualApproval: boolean;
  requiresComplianceReview: boolean;
  blocked: boolean;
  blockReason?: string;
  riskScore?: number;
  recommendations?: string[];
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
            requiresOTP: false,
            requiresBiometric: false,
            requiresManualApproval: false,
            requiresComplianceReview: false,
            blocked: false
          };

        case 'medium':
          const mediumResult = await mediumRiskApprovalService.checkMediumRiskApproval(
            amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress, request.passkeyVerified
          );
          return {
            approved: mediumResult.passkeyVerified,
            riskLevel: 'medium',
            requiresAction: !mediumResult.passkeyVerified,
            actionRequired: !mediumResult.passkeyVerified ? 'Passkey verification required' : undefined,
            autoApproved: false,
            requiresPasskey: true,
            requiresOTP: false,
            requiresBiometric: false,
            requiresManualApproval: false,
            requiresComplianceReview: false,
            blocked: false,
            nextSteps: !mediumResult.passkeyVerified ? ['Complete passkey verification'] : undefined
          };

        case 'high':
          const highResult = await highRiskApprovalService.checkHighRiskApproval(
            amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress, 
            request.passkeyVerified, request.otpCode ? true : false, request.otpCode
          );
          return {
            approved: highResult.passkeyVerified && highResult.otpVerified,
            riskLevel: 'high',
            requiresAction: !highResult.passkeyVerified || !highResult.otpVerified,
            actionRequired: !highResult.passkeyVerified ? 'Passkey verification required' : 
                           !highResult.otpVerified ? 'OTP verification required' : undefined,
            autoApproved: false,
            requiresPasskey: true,
            requiresOTP: true,
            requiresBiometric: false,
            requiresManualApproval: false,
            requiresComplianceReview: false,
            blocked: false,
            nextSteps: !highResult.passkeyVerified ? ['Complete passkey verification'] :
                      !highResult.otpVerified ? ['Check email for OTP code', 'Enter OTP code'] : undefined
          };

        case 'very-high':
          const veryHighResult = await veryHighRiskApprovalService.checkVeryHighRiskApproval(
            amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress,
            request.passkeyVerified, request.biometricVerified, request.manualApproved, userLocation
          );
          return {
            approved: veryHighResult.passkeyVerified && veryHighResult.biometricVerified && veryHighResult.manualApproved,
            riskLevel: 'very-high',
            requiresAction: !veryHighResult.passkeyVerified || !veryHighResult.biometricVerified || !veryHighResult.manualApproved,
            actionRequired: !veryHighResult.passkeyVerified ? 'Passkey verification required' :
                           !veryHighResult.biometricVerified ? 'Biometric verification required' :
                           !veryHighResult.manualApproved ? 'Manual approval required' : undefined,
            autoApproved: false,
            requiresPasskey: true,
            requiresOTP: false,
            requiresBiometric: true,
            requiresManualApproval: true,
            requiresComplianceReview: false,
            blocked: false,
            riskScore: veryHighResult.riskScore,
            nextSteps: !veryHighResult.passkeyVerified ? ['Complete passkey verification'] :
                      !veryHighResult.biometricVerified ? ['Complete biometric verification'] :
                      !veryHighResult.manualApproved ? ['Wait for manual approval'] : undefined
          };

        case 'extreme':
          const extremeResult = await extremeRiskApprovalService.checkExtremeRiskApproval(
            amount, toAddress, fromAddress, userCountry, deviceFingerprint, ipAddress, userLocation
          );
          return {
            approved: !extremeResult.blocked && extremeResult.complianceReviewPassed,
            riskLevel: 'extreme',
            requiresAction: extremeResult.requiresComplianceReview || extremeResult.blocked,
            actionRequired: extremeResult.blocked ? extremeResult.blockReason :
                           extremeResult.requiresComplianceReview ? 'Compliance review required' : undefined,
            autoApproved: false,
            requiresPasskey: false,
            requiresOTP: false,
            requiresBiometric: false,
            requiresManualApproval: false,
            requiresComplianceReview: extremeResult.requiresComplianceReview,
            blocked: extremeResult.blocked,
            blockReason: extremeResult.blockReason,
            riskScore: extremeResult.riskScore,
            nextSteps: extremeResult.blocked ? ['Transaction blocked'] :
                      extremeResult.requiresComplianceReview ? ['Wait for compliance review'] : undefined
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
          requirements: ['Amount under $100', 'Low-risk country', 'Daily limit check']
        };
      case 'medium':
        return {
          name: 'Medium Risk',
          description: 'Requires passkey verification',
          maxAmount: MEDIUM_RISK_POLICY.maxAmount,
          requirements: ['Passkey verification', 'Device verification', 'Velocity check']
        };
      case 'high':
        return {
          name: 'High Risk',
          description: 'Requires passkey + OTP verification',
          maxAmount: HIGH_RISK_POLICY.maxAmount,
          requirements: ['Passkey verification', 'OTP verification', 'Address risk check']
        };
      case 'very-high':
        return {
          name: 'Very High Risk',
          description: 'Requires biometric + manual approval',
          maxAmount: VERY_HIGH_RISK_POLICY.maxAmount,
          requirements: ['Passkey verification', 'Biometric verification', 'Manual approval', 'Geo check']
        };
      case 'extreme':
        return {
          name: 'Extreme Risk',
          description: 'Requires compliance review',
          maxAmount: EXTREME_RISK_POLICY.maxAmount,
          requirements: ['Compliance review', 'Sanctions check', 'Blacklist check', 'Time restrictions']
        };
    }
  }
}

export const dynamicApprovalManager = new DynamicApprovalManager(); 