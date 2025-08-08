"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Scan, Loader2, AlertCircle, CheckCircle, Shield, Lock, Eye, EyeOff, Fingerprint, Mail, Clock, AlertTriangle } from 'lucide-react'
import { sendUSDC, getUSDCBalance, checkNetwork, switchToSepolia, USDCBalance } from "@/lib/usdc"
import { dynamicApprovalManager, ApprovalRequest, ApprovalResponse } from "@/lib/approval"
import { mediumRiskApprovalService } from "@/lib/approval/medium"
import { highRiskApprovalService } from "@/lib/approval/high"
import { veryHighRiskApprovalService } from "@/lib/approval/very-high"
import PasswordDialog from "@/components/password-dialog"
import PasskeyVerification from "@/components/PasskeyVerification"
import { toast } from "sonner"

interface SendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaultId?: string
}

export default function SendModal({ open, onOpenChange, vaultId }: SendModalProps) {
  const [selectedAsset, setSelectedAsset] = useState("USDC")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<USDCBalance | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState("")
  
  // Approval system states
  const [approvalResponse, setApprovalResponse] = useState<ApprovalResponse | null>(null)
  const [approvalStep, setApprovalStep] = useState<'initial' | 'password' | 'passkey' | 'otp' | 'biometric' | 'manual' | 'compliance' | 'complete'>('initial')
  const [otpCode, setOtpCode] = useState("")
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [passkeyVerified, setPasskeyVerified] = useState(false)
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [biometricVerified, setBiometricVerified] = useState(false)
  const [manualApproved, setManualApproved] = useState(false)

  // Password dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPasskeyDialog, setShowPasskeyDialog] = useState(false)

  const assets = [
    { symbol: "USDC", name: "USD Coin", balance: usdcBalance?.balance || "0", icon: "💵" },
  ]

  const selectedAssetData = assets.find(asset => asset.symbol === selectedAsset)

  // Fetch USDC balance when modal opens
  useEffect(() => {
    if (open && selectedAsset === "USDC" && vaultId) {
      fetchUSDCBalance()
    }
  }, [open, selectedAsset, vaultId])

  const fetchUSDCBalance = async () => {
    if (!vaultId) return
    
    setBalanceLoading(true)
    try {
      const balance = await getUSDCBalance(vaultId)
      setUsdcBalance(balance)
    } catch (error) {
      console.error('Failed to fetch USDC balance:', error)
      toast.error('Failed to fetch balance')
    } finally {
      setBalanceLoading(false)
    }
  }

  const checkApproval = async (): Promise<ApprovalResponse> => {
    if (!vaultId || !recipient || !amount) {
      throw new Error('Missing required fields')
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid amount')
    }

    const request: ApprovalRequest = {
      amount: numAmount,
      toAddress: recipient,
      fromAddress: vaultId,
      userCountry: 'US', // This would come from user profile or IP geolocation
      deviceFingerprint: 'device123', // This would be generated from device info
      ipAddress: '192.168.1.1', // This would come from request
      passkeyVerified,
      passwordVerified,
      otpCode: showOtpInput ? otpCode : undefined,
      manualApproved
    }

    return await dynamicApprovalManager.processApproval(request)
  }

  const handleSend = async () => {
    if (!recipient || !amount) {
      toast.error("Please fill in all fields")
      return
    }

    if (!vaultId) {
      toast.error("No wallet selected")
      return
    }

    if (selectedAsset === "USDC") {
      await handleSendUSDC()
    }
  }

  const handleSendUSDC = async () => {
    if (!vaultId) {
      toast.error("No wallet selected")
      return
    }

    try {
      setLoading(true)
      setTransactionStatus('pending')
      setErrorMessage("")

      // Check approval requirements
      const approval = await checkApproval()
      setApprovalResponse(approval)

      if (approval.blocked) {
        setTransactionStatus('error')
        setErrorMessage(approval.blockReason || 'Transaction blocked')
        toast.error(approval.blockReason || 'Transaction blocked')
        return
      }

      if (approval.autoApproved) {
        // Proceed with transaction immediately
        await executeTransaction()
        return
      }

      // Handle different approval requirements
      if (approval.requiresPassword && !passwordVerified) {
        setApprovalStep('password')
        setShowPasswordDialog(true)
        return
      }

      if (approval.requiresPasskey && !passkeyVerified) {
        setApprovalStep('passkey')
        return
      }

      if (approval.requiresOTP && !showOtpInput) {
        setApprovalStep('otp')
        setShowOtpInput(true)
        
        // Send OTP to user's email - authenticated request
        try {
          const response = await fetch('/api/otp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            // Don't send body for authenticated requests - the API will use the authenticated user
          })
          
          const data = await response.json()
          
          if (response.ok) {
            toast.success('OTP code sent to your email')
          } else {
            toast.error(data.error || 'Failed to send OTP')
            setApprovalStep('initial')
          }
        } catch (error) {
          console.error('Failed to send OTP:', error)
          toast.error('Failed to send OTP code')
          setApprovalStep('initial')
        }
        return
      }

      if (approval.requiresBiometric && !biometricVerified) {
        setApprovalStep('biometric')
        return
      }

      if (approval.requiresManualApproval && !manualApproved) {
        setApprovalStep('manual')
        toast.info('Manual approval required')
        return
      }

      if (approval.requiresComplianceReview) {
        setApprovalStep('compliance')
        toast.info('Compliance review required')
        return
      }

      // All approvals complete, proceed with transaction
      await executeTransaction()

    } catch (error: any) {
      console.error('Failed to process approval:', error)
      setTransactionStatus('error')
      setErrorMessage(error.message || 'Approval failed')
      toast.error(error.message || 'Failed to process approval')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordVerified = () => {
    setPasswordVerified(true)
    setApprovalStep('initial')
    
    // Update transaction tracking for medium risk transactions
    if (approvalResponse?.riskLevel === 'medium' && vaultId) {
      const numAmount = parseFloat(amount)
      if (!isNaN(numAmount) && numAmount > 0) {
        mediumRiskApprovalService.updateTransactionTracking(vaultId, numAmount)
      }
    }
    
    // Re-check approval with updated state
    checkApproval().then(approval => {
      setApprovalResponse(approval)
      if (approval.approved) {
        executeTransaction()
      }
    }).catch(error => {
      console.error('Failed to re-check approval:', error)
      toast.error('Failed to process approval')
    })
  }

  const executeTransaction = async () => {
    try {
      // Validate amount
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Invalid amount')
      }

      // Check if user has enough balance
      if (usdcBalance && parseFloat(usdcBalance.balance) < numAmount) {
        throw new Error('Insufficient USDC balance')
      }

      // Validate recipient address
      if (!recipient.startsWith('0x') || recipient.length !== 42) {
        throw new Error('Invalid recipient address')
      }

      // Send USDC
      if (!vaultId) {
        throw new Error('No wallet selected')
      }
      const txHash = await sendUSDC(vaultId, amount, recipient)
      
      setTransactionStatus('success')
      setApprovalStep('complete')
      toast.success(`USDC sent successfully! Transaction: ${txHash}`)
      
      // Reset form
      setRecipient("")
      setAmount("")
      resetApprovalStates()
      
      // Refresh balance
      await fetchUSDCBalance()
      
      // Close modal after a delay
      setTimeout(() => {
        onOpenChange(false)
        setTransactionStatus('idle')
        setApprovalStep('initial')
      }, 2000)
      
    } catch (error: any) {
      console.error('Failed to send USDC:', error)
      setTransactionStatus('error')
      setErrorMessage(error.message || 'Transaction failed')
      toast.error(error.message || 'Failed to send USDC')
    }
  }

  const resetApprovalStates = () => {
    setApprovalResponse(null)
    setApprovalStep('initial')
    setOtpCode("")
    setShowOtpInput(false)
    setPasskeyVerified(false)
    setPasswordVerified(false)
    setBiometricVerified(false)
    setManualApproved(false)
    setShowPasswordDialog(false)
    setShowPasskeyDialog(false)
  }

  const handlePasskeyVerification = async () => {
    try {
      // This would integrate with WebAuthn/Passkey verification
      // For demo purposes, we'll simulate success
      setPasskeyVerified(true)
      toast.success('Passkey verification successful')
      
      // Update transaction tracking for high risk transactions
      if (approvalResponse?.riskLevel === 'high' && vaultId) {
        const numAmount = parseFloat(amount)
        if (!isNaN(numAmount) && numAmount > 0) {
          highRiskApprovalService.updateTransactionTracking(vaultId, numAmount)
        }
      }

      // Re-check approval with updated state
      const approval = await checkApproval()
      setApprovalResponse(approval)
      
      if (approval.requiresOTP) {
        setApprovalStep('otp')
        setShowOtpInput(true)
        toast.info('OTP code sent to your email')
      } else if (approval.requiresBiometric) {
        setApprovalStep('biometric')
      } else if (approval.requiresManualApproval) {
        setApprovalStep('manual')
      } else if (approval.requiresComplianceReview) {
        setApprovalStep('compliance')
      } else {
        await executeTransaction()
      }
    } catch (error: any) {
      toast.error('Passkey verification failed')
    }
  }

  const handlePasskeyVerificationComplete = (success: boolean) => {
    if (success) {
      setPasskeyVerified(true)
      toast.success('Passkey verification successful')
      
      // Update transaction tracking for high risk transactions
      if (approvalResponse?.riskLevel === 'high' && vaultId) {
        const numAmount = parseFloat(amount)
        if (!isNaN(numAmount) && numAmount > 0) {
          highRiskApprovalService.updateTransactionTracking(vaultId, numAmount)
        }
      }

      // Re-check approval with updated state
      checkApproval().then(approval => {
        setApprovalResponse(approval)
        if (approval.approved) {
          executeTransaction()
        } else if (approval.requiresOTP) {
          setApprovalStep('otp')
          setShowOtpInput(true)
          
          // Send OTP to user's email - authenticated request
          fetch('/api/otp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            // Don't send body for authenticated requests - the API will use the authenticated user
          }).then(response => response.json())
          .then(data => {
            if (data.success) {
              toast.success('OTP code sent to your email')
            } else {
              toast.error(data.error || 'Failed to send OTP')
              setApprovalStep('initial')
            }
          }).catch(error => {
            console.error('Failed to send OTP:', error)
            toast.error('Failed to send OTP code')
            setApprovalStep('initial')
          })
        } else if (approval.requiresBiometric) {
          setApprovalStep('biometric')
        } else if (approval.requiresManualApproval) {
          setApprovalStep('manual')
        } else if (approval.requiresComplianceReview) {
          setApprovalStep('compliance')
        }
      }).catch(error => {
        console.error('Failed to re-check approval:', error)
        toast.error('Failed to process approval')
      })
    } else {
      toast.error('Passkey verification cancelled')
    }
  }

  const handleBiometricVerification = async () => {
    try {
      // This would integrate with biometric verification
      setBiometricVerified(true)
      toast.success('Biometric verification successful')
      
      const approval = await checkApproval()
      setApprovalResponse(approval)
      
      if (approval.requiresManualApproval) {
        setApprovalStep('manual')
      } else {
        await executeTransaction()
      }
    } catch (error: any) {
      toast.error('Biometric verification failed')
    }
  }

  const handleOtpSubmit = async () => {
    if (!otpCode) {
      toast.error('Please enter OTP code')
      return
    }

    try {
      setLoading(true)
      
      // Verify OTP using API
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: otpCode }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // OTP verified successfully
        toast.success('OTP verified successfully')
        
        // Update transaction tracking for very-high risk transactions
        if (approvalResponse?.riskLevel === 'very-high' && vaultId) {
          const numAmount = parseFloat(amount)
          if (!isNaN(numAmount) && numAmount > 0) {
            veryHighRiskApprovalService.updateTransactionTracking(vaultId, numAmount)
          }
        }
        
        // Proceed with transaction
        await executeTransaction()
      } else {
        toast.error(data.error || 'Invalid OTP code')
      }
    } catch (error: any) {
      console.error('OTP verification error:', error)
      toast.error('OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleMaxAmount = () => {
    if (usdcBalance) {
      setAmount(usdcBalance.balance)
    }
  }

  const renderApprovalStep = () => {
    if (!approvalResponse) return null

    const riskInfo = dynamicApprovalManager.getRiskLevelInfo(approvalResponse.riskLevel)

    switch (approvalStep) {
      case 'password':
        return (
          <Card className="bg-slate-700/50 border-slate-600">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getRiskLevelColor(approvalResponse.riskLevel)}>
                  {getRiskLevelIcon(approvalResponse.riskLevel)}
                  {riskInfo.name}
                </Badge>
              </div>
              <div className="text-sm text-slate-300">
                <p className="mb-2">{riskInfo.description}</p>
                <p className="text-slate-400">Amount: ${amount} USDC</p>
              </div>
              <Button 
                onClick={() => setShowPasswordDialog(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Lock className="w-4 h-4 mr-2" />
                Enter Password
              </Button>
            </CardContent>
          </Card>
        )

      case 'passkey':
        return (
          <Card className="bg-slate-700/50 border-slate-600">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getRiskLevelColor(approvalResponse.riskLevel)}>
                  {getRiskLevelIcon(approvalResponse.riskLevel)}
                  {riskInfo.name}
                </Badge>
              </div>
              <div className="text-sm text-slate-300">
                <p className="mb-2">{riskInfo.description}</p>
                <p className="text-slate-400">Amount: ${amount} USDC</p>
              </div>
              <Button 
                onClick={() => setShowPasskeyDialog(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                Verify with Passkey
              </Button>
            </CardContent>
          </Card>
        )

      case 'otp':
        return (
          <Card className="bg-slate-700/50 border-slate-600">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getRiskLevelColor(approvalResponse.riskLevel)}>
                  {getRiskLevelIcon(approvalResponse.riskLevel)}
                  {riskInfo.name}
                </Badge>
              </div>
              <div className="text-sm text-slate-300">
                <p className="mb-2">Enter the OTP code sent to your email</p>
                <p className="text-slate-400">Amount: ${amount} USDC</p>
              </div>
              <Input
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                maxLength={6}
              />
              <Button 
                onClick={handleOtpSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || !otpCode}
              >
                <Mail className="w-4 h-4 mr-2" />
                Verify OTP
              </Button>
            </CardContent>
          </Card>
        )

      case 'biometric':
        return (
          <Card className="bg-slate-700/50 border-slate-600">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getRiskLevelColor(approvalResponse.riskLevel)}>
                  {getRiskLevelIcon(approvalResponse.riskLevel)}
                  {riskInfo.name}
                </Badge>
              </div>
              <div className="text-sm text-slate-300">
                <p className="mb-2">Complete biometric verification</p>
                <p className="text-slate-400">Amount: ${amount} USDC</p>
              </div>
              <Button 
                onClick={handleBiometricVerification}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                Verify Biometric
              </Button>
            </CardContent>
          </Card>
        )

      case 'manual':
        return (
          <Card className="bg-slate-700/50 border-slate-600">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getRiskLevelColor(approvalResponse.riskLevel)}>
                  {getRiskLevelIcon(approvalResponse.riskLevel)}
                  {riskInfo.name}
                </Badge>
              </div>
              <div className="text-sm text-slate-300">
                <p className="mb-2">Manual approval required. Please contact support.</p>
                <p className="text-slate-400">Amount: ${amount} USDC</p>
              </div>
              <div className="flex items-center space-x-2 text-yellow-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Waiting for approval...</span>
              </div>
            </CardContent>
          </Card>
        )

      case 'compliance':
        return (
          <Card className="bg-slate-700/50 border-slate-600">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getRiskLevelColor(approvalResponse.riskLevel)}>
                  {getRiskLevelIcon(approvalResponse.riskLevel)}
                  {riskInfo.name}
                </Badge>
              </div>
              <div className="text-sm text-slate-300">
                <p className="mb-2">Compliance review required for this transaction.</p>
                <p className="text-slate-400">Amount: ${amount} USDC</p>
              </div>
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Transaction blocked for compliance review</span>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-600 hover:bg-green-700'
      case 'medium': return 'bg-yellow-600 hover:bg-yellow-700'
      case 'high': return 'bg-orange-600 hover:bg-orange-700'
      case 'very-high': return 'bg-red-600 hover:bg-red-700'
      case 'extreme': return 'bg-purple-600 hover:bg-purple-700'
      default: return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '🟢'
      case 'medium': return '🟡'
      case 'high': return '🟠'
      case 'very-high': return '🔴'
      case 'extreme': return '🟣'
      default: return '⚪'
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white/20 border-white/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <span>Send {selectedAsset}</span>
            </DialogTitle>
            <DialogDescription className="text-gray-900">
              Transfer {selectedAsset} to another wallet address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Asset Selection */}
            <div className="space-y-2">
              <Label htmlFor="asset" className="text-gray-900">Asset</Label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger className="bg-white/50 border-white/20 text-gray-900 placeholder:text-gray-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/90 border-white/20">
                  {assets.map((asset) => (
                    <SelectItem key={asset.symbol} value={asset.symbol}>
                      <div className="flex items-center space-x-2">
                        <span>{asset.icon}</span>
                        <span>{asset.name}</span>
                        <span className="text-gray-500">({asset.balance})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Address */}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-gray-900">Recipient Address</Label>
              <div className="relative">
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-white/50 border-white/20 text-gray-900 placeholder:text-gray-500 pr-10"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1 h-6 w-6 p-0 text-gray-600 hover:text-gray-900"
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-900">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white/50 border-white/20 text-gray-900 placeholder:text-gray-500 pr-16"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMaxAmount}
                  className="absolute right-1 top-1 h-6 w-6 p-0 text-xs text-gray-600 hover:text-gray-900"
                >
                  MAX
                </Button>
              </div>
              {balanceLoading && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading balance...</span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center space-x-2 p-3 bg-red-100/80 border border-red-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">{errorMessage}</span>
              </div>
            )}

            {/* Transaction Summary */}
            {amount && recipient && approvalStep === 'initial' && (
              <Card className="bg-white/50 border-white/20">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Risk Level</span>
                    <Badge className={getRiskLevelColor(dynamicApprovalManager.getRiskLevel(parseFloat(amount)))}>
                      {getRiskLevelIcon(dynamicApprovalManager.getRiskLevel(parseFloat(amount)))}
                      {dynamicApprovalManager.getRiskLevelInfo(dynamicApprovalManager.getRiskLevel(parseFloat(amount))).name}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Network Fee</span>
                    <span className="text-gray-900">~$0.50</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold text-gray-900">{amount} USDC</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval Step */}
            {approvalStep !== 'initial' && renderApprovalStep()}

            {/* Transaction Status */}
            {transactionStatus === 'pending' && approvalStep === 'initial' && (
              <div className="flex items-center space-x-2 p-3 bg-blue-100/80 border border-blue-200 rounded-md">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-600">Processing transaction...</span>
              </div>
            )}

            {transactionStatus === 'success' && (
              <div className="flex items-center space-x-2 p-3 bg-green-100/80 border border-green-200 rounded-md">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Transaction successful!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                variant="ghost"
                onClick={() => {
                  onOpenChange(false)
                  resetApprovalStates()
                }} 
                className="flex-1 text-slate-600 hover:text-gray-900"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-br from-orange-400 to-red-400 text-white hover:from-orange-500 hover:to-red-500"
                onClick={handleSend}
                disabled={loading || !recipient || !amount || transactionStatus === 'success' || !vaultId || approvalStep !== 'initial'}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onPasswordVerified={handlePasswordVerified}
        amount={parseFloat(amount) || 0}
        toAddress={recipient}
        fromAddress={vaultId}
        riskLevel={approvalResponse?.riskLevel || 'medium'}
      />

      {/* Passkey Verification Dialog */}
      <PasskeyVerification
        open={showPasskeyDialog}
        onOpenChange={setShowPasskeyDialog}
        onVerificationComplete={handlePasskeyVerificationComplete}
        amount={parseFloat(amount) || 0}
        toAddress={recipient}
        fromAddress={vaultId || ''}
        riskLevel={approvalResponse?.riskLevel || 'high'}
      />
    </>
  )
}
