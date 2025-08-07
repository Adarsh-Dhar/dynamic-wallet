"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, Shield, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { startAuthentication } from "@simplewebauthn/browser"

interface PasskeyVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerificationComplete: (success: boolean) => void
  amount: number
  toAddress: string
  fromAddress: string
  riskLevel: string
}

export default function PasskeyVerification({
  open,
  onOpenChange,
  onVerificationComplete,
  amount,
  toAddress,
  fromAddress,
  riskLevel
}: PasskeyVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<'init' | 'authenticating' | 'success' | 'error'>('init')

  const handlePasskeyVerification = async () => {
    try {
      setLoading(true)
      setError("")
      setStep('authenticating')

      // Step 1: Generate authentication options from server
      const optionsResponse = await fetch('/api/auth/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionContext: {
            amount,
            toAddress,
            fromAddress,
            riskLevel
          }
        }),
      })

      const optionsData = await optionsResponse.json()
      
      if (!optionsData.success) {
        setError(optionsData.error || 'Failed to generate authentication options')
        setStep('error')
        return
      }

      // Step 2: Start WebAuthn authentication on the client
      const credential = await startAuthentication(optionsData.data)

      // Step 3: Verify the authentication with server
      const verifyResponse = await fetch('/api/auth/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          challenge: optionsData.data.challenge,
          transactionContext: {
            amount,
            toAddress,
            fromAddress,
            riskLevel
          }
        }),
      })

      const verifyData = await verifyResponse.json()
      
      if (verifyData.success) {
        setStep('success')
        setTimeout(() => {
          onVerificationComplete(true)
          onOpenChange(false)
        }, 1500)
      } else {
        setError(verifyData.error || 'Passkey authentication failed')
        setStep('error')
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      setError(error.message || 'Failed to authenticate with passkey')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'very-high': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'extreme': return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    }
  }

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <Shield className="w-4 h-4" />
      case 'very-high': return <Shield className="w-4 h-4" />
      case 'extreme': return <Shield className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  const handleClose = () => {
    if (step === 'success') {
      onVerificationComplete(true)
    } else {
      onVerificationComplete(false)
    }
    onOpenChange(false)
    setStep('init')
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Fingerprint className="w-5 h-5 text-blue-400" />
            <span>Passkey Verification Required</span>
          </DialogTitle>
          <DialogDescription>
            Complete biometric verification to proceed with this high-value transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Details */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Risk Level</span>
                <Badge className={getRiskLevelColor(riskLevel)}>
                  {getRiskLevelIcon(riskLevel)}
                  {riskLevel === 'high' ? 'High Risk' : 
                   riskLevel === 'very-high' ? 'Very High Risk' : 
                   riskLevel === 'extreme' ? 'Extreme Risk' : 'Risk'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Amount</span>
                <span className="text-white font-medium">${amount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">To Address</span>
                <span className="text-slate-300 font-mono text-xs">
                  {toAddress.slice(0, 6)}...{toAddress.slice(-4)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && step === 'error' && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {step === 'success' && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Passkey verification successful! Transaction approved.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {step === 'init' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePasskeyVerification}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Fingerprint className="w-4 h-4 mr-2" />
                  )}
                  Verify with Passkey
                </Button>
              </>
            )}

            {step === 'authenticating' && (
              <div className="flex items-center justify-center w-full py-4">
                <div className="flex items-center space-x-2 text-blue-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Waiting for biometric verification...</span>
                </div>
              </div>
            )}

            {step === 'error' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePasskeyVerification}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </>
            )}

            {step === 'success' && (
              <Button 
                onClick={handleClose}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Continue
              </Button>
            )}
          </div>

          {/* Instructions */}
          {step === 'init' && (
            <div className="text-xs text-slate-400 space-y-1">
              <p>• Use your device's biometric sensor (fingerprint, face ID)</p>
              <p>• Or enter your device PIN/password</p>
              <p>• This verification is required for transactions over $3 USDC</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 