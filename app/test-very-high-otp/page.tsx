"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, Shield, AlertTriangle } from 'lucide-react'
import { toast } from "sonner"

export default function TestVeryHighOtp() {
  const [loading, setLoading] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [result, setResult] = useState("")

  const testSendOtp = async () => {
    setLoading(true)
    setResult("")
    
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(JSON.stringify(data, null, 2))
        setShowOtpInput(true)
        toast.success('OTP sent successfully! Check your email.')
      } else {
        setResult(JSON.stringify(data, null, 2))
        toast.error(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      const errorMessage = `Error: ${error}`
      setResult(errorMessage)
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const testVerifyOtp = async () => {
    if (!otpCode) {
      toast.error('Please enter OTP code')
      return
    }

    setLoading(true)
    setResult("")
    
    try {
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
        setResult(JSON.stringify(data, null, 2))
        toast.success('OTP verified successfully!')
        setShowOtpInput(false)
        setOtpCode("")
      } else {
        setResult(JSON.stringify(data, null, 2))
        toast.error(data.error || 'Invalid OTP code')
      }
    } catch (error) {
      const errorMessage = `Error: ${error}`
      setResult(errorMessage)
      toast.error('OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const testVeryHighRiskTransaction = async () => {
    setLoading(true)
    setResult("")
    
    try {
      // Simulate a very high-risk transaction ($6 USDC)
      const transactionData = {
        amount: 6,
        toAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        fromAddress: "test-vault-id",
        userCountry: "US",
        deviceFingerprint: "device123",
        ipAddress: "192.168.1.1"
      }

      const response = await fetch('/api/usdc/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(transactionData),
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
      
      if (response.ok) {
        toast.success('Transaction processed successfully!')
      } else {
        toast.error(data.error || 'Transaction failed')
      }
    } catch (error) {
      const errorMessage = `Error: ${error}`
      setResult(errorMessage)
      toast.error('Transaction test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Very High Risk OTP Test</h1>
          <p className="text-slate-400">Test the OTP functionality for very high-risk transactions ($5-$7 USDC)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OTP Send Test */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Send OTP Test
              </CardTitle>
              <CardDescription className="text-slate-400">
                Test sending OTP to your email for transaction approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testSendOtp}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send OTP
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* OTP Verify Test */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                Verify OTP Test
              </CardTitle>
              <CardDescription className="text-slate-400">
                Test verifying the OTP code you received
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showOtpInput ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-slate-300">OTP Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <Button 
                    onClick={testVerifyOtp}
                    disabled={loading || !otpCode}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Verify OTP
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center text-slate-400">
                  <Mail className="w-8 h-8 mx-auto mb-2" />
                  <p>Send OTP first to test verification</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Very High Risk Transaction Test */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Very High Risk Transaction Test
            </CardTitle>
            <CardDescription className="text-slate-400">
              Test a $6 USDC transaction that should trigger OTP verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Very High Risk
                </Badge>
                <span className="text-slate-400">Amount: $6 USDC</span>
              </div>
              <Button 
                onClick={testVeryHighRiskTransaction}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing Transaction...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Test Very High Risk Transaction
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-700 p-4 rounded text-sm text-slate-200 overflow-auto">
                {result}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 