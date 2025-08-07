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
  const [approvalStep, setApprovalStep] = useState<'initial' | 'passkey' | 'otp' | 'biometric' | 'manual' | 'compliance' | 'complete'>('initial')
  const [otpCode, setOtpCode] = useState("")
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [passkeyVerified, setPasskeyVerified] = useState(false)
  const [biometricVerified, setBiometricVerified] = useState(false)
  const [manualApproved, setManualApproved] = useState(false)

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
    if (!vaultId) {
      setErrorMessage('No wallet selected')
      return
    }

    try {
      setBalanceLoading(true)
      setErrorMessage("")
      
      const balance = await getUSDCBalance(vaultId)
      setUsdcBalance(balance)
    } catch (error: any) {
      console.error('Failed to fetch USDC balance:', error)
      setErrorMessage(error.message || 'Failed to fetch balance')
    } finally {
      setBalanceLoading(false)
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'very-high': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'extreme': return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    }
  }

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <Shield className="w-4 h-4" />
      case 'medium': return <Lock className="w-4 h-4" />
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'very-high': return <AlertTriangle className="w-4 h-4" />
      case 'extreme': return <AlertTriangle className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
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
      biometricVerified,
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
      if (approval.requiresPasskey && !passkeyVerified) {
        setApprovalStep('passkey')
        return
      }

      if (approval.requiresOTP && !showOtpInput) {
        setApprovalStep('otp')
        setShowOtpInput(true)
        toast.info('OTP code sent to your email')
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
    setBiometricVerified(false)
    setManualApproved(false)
  }

  const handlePasskeyVerification = async () => {
    try {
      // This would integrate with WebAuthn/Passkey verification
      // For demo purposes, we'll simulate success
      setPasskeyVerified(true)
      toast.success('Passkey verification successful')
      
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
      const approval = await checkApproval()
      setApprovalResponse(approval)
      
      if (approval.approved) {
        await executeTransaction()
      } else {
        toast.error('Invalid OTP code')
      }
    } catch (error: any) {
      toast.error('OTP verification failed')
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
                onClick={handlePasskeyVerification}
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
                className="bg-slate-700 border-slate-600"
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
                <p className="mb-2">Manual approval required for this transaction</p>
                <p className="text-slate-400">Amount: ${amount} USDC</p>
                <p className="text-slate-400">Risk Score: {approvalResponse.riskScore}</p>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-yellow-900/20 border border-yellow-600/50 rounded-md">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-200">Waiting for manual approval...</span>
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
                <p className="mb-2">Compliance review required for this transaction</p>
                <p className="text-slate-400">Amount: ${amount} USDC</p>
                <p className="text-slate-400">Risk Score: {approvalResponse.riskScore}</p>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-purple-900/20 border border-purple-600/50 rounded-md">
                <AlertTriangle className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-200">Compliance review in progress...</span>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Send USDC</DialogTitle>
          <DialogDescription className="text-slate-400">
            Send USDC to another wallet address on Sepolia network
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Asset Selection */}
          <div className="space-y-2">
            <Label>Select Asset</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {assets.map((asset) => (
                  <SelectItem key={asset.symbol} value={asset.symbol}>
                    <div className="flex items-center space-x-2">
                      <span>{asset.icon}</span>
                      <span>{asset.symbol}</span>
                      <span className="text-slate-400">
                        {balanceLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin inline" />
                        ) : (
                          `(${asset.balance})`
                        )}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-600/50 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-200">{errorMessage}</span>
            </div>
          )}

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label>Recipient Address</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-slate-700 border-slate-600"
                disabled={loading}
              />
              <Button variant="outline" size="icon" className="border-slate-600" disabled={loading}>
                <Scan className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="space-y-2">
              <Input
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-700 border-slate-600"
                disabled={loading}
                type="number"
                step="0.000001"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>
                  Available: {balanceLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                  ) : (
                    `${usdcBalance?.balance || '0'} USDC`
                  )}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-400 p-0 h-auto"
                  onClick={handleMaxAmount}
                  disabled={loading || !usdcBalance}
                >
                  Max
                </Button>
              </div>
            </div>
          </div>

          {/* Risk Level Preview */}
          {amount && recipient && approvalStep === 'initial' && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Risk Level</span>
                  <Badge className={getRiskLevelColor(dynamicApprovalManager.getRiskLevel(parseFloat(amount)))}>
                    {getRiskLevelIcon(dynamicApprovalManager.getRiskLevel(parseFloat(amount)))}
                    {dynamicApprovalManager.getRiskLevelInfo(dynamicApprovalManager.getRiskLevel(parseFloat(amount))).name}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Network Fee</span>
                  <span>~$0.50</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total</span>
                  <span className="font-semibold">{amount} USDC</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Step */}
          {approvalStep !== 'initial' && renderApprovalStep()}

          {/* Transaction Status */}
          {transactionStatus === 'pending' && approvalStep === 'initial' && (
            <div className="flex items-center space-x-2 p-3 bg-blue-900/20 border border-blue-600/50 rounded-md">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-sm text-blue-200">Processing transaction...</span>
            </div>
          )}

          {transactionStatus === 'success' && (
            <div className="flex items-center space-x-2 p-3 bg-green-900/20 border border-green-600/50 rounded-md">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-200">Transaction successful!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false)
                resetApprovalStates()
              }} 
              className="flex-1 border-slate-600"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
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
  )
}
