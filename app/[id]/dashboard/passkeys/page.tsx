"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Shield, Smartphone, Monitor, Loader2 } from "lucide-react"
import { startRegistration, startAuthentication } from "@simplewebauthn/browser"

interface Passkey {
  id: string
  name?: string
  credentialID: string
  lastUsedAt: string
  createdAt: string
  transports: string[]
}

export default function PasskeysPage() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    loadPasskeys()
  }, [])

  const loadPasskeys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/passkey/list')
      const data = await response.json()
      
      if (data.success) {
        setPasskeys(data.passkeys)
      } else {
        setError(data.error || 'Failed to load passkeys')
      }
    } catch (error) {
      setError('Failed to load passkeys')
    } finally {
      setLoading(false)
    }
  }

  const registerPasskey = async () => {
    try {
      setRegistering(true)
      setError("")
      setSuccess("")

      // Get user's email (you might want to get this from user context)
      const userResponse = await fetch('/api/auth/me')
      const userData = await userResponse.json()
      
      if (!userData.user?.email) {
        setError('User email not found')
        return
      }

      // Generate registration options
      const optionsResponse = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.user.email }),
      })

      const optionsData = await optionsResponse.json()
      
      if (!optionsData.success) {
        setError(optionsData.error || 'Failed to generate registration options')
        return
      }

      // Start registration on the client
      const credential = await startRegistration(optionsData.data)

      // Verify the registration
      const verifyResponse = await fetch('/api/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          challenge: optionsData.data.challenge,
        }),
      })

      const verifyData = await verifyResponse.json()
      
      if (verifyData.success) {
        setSuccess('Passkey registered successfully!')
        loadPasskeys() // Reload the list
      } else {
        setError(verifyData.error || 'Failed to register passkey')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Failed to register passkey')
    } finally {
      setRegistering(false)
    }
  }

  const deletePasskey = async (passkeyId: string) => {
    if (!confirm('Are you sure you want to delete this passkey?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/auth/passkey/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkeyId }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Passkey deleted successfully!')
        loadPasskeys() // Reload the list
      } else {
        setError(data.error || 'Failed to delete passkey')
      }
    } catch (error) {
      setError('Failed to delete passkey')
    } finally {
      setLoading(false)
    }
  }

  const getTransportIcon = (transports: string[]) => {
    if (transports.includes('internal')) return <Smartphone className="w-4 h-4" />
    if (transports.includes('usb')) return <Monitor className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Passkeys</h1>
              <p className="text-gray-600 mt-2">
                Manage your passkeys for enhanced security on high-value transactions
              </p>
            </div>
          </div>
          <Button
            onClick={registerPasskey}
            disabled={registering}
            className="bg-black hover:bg-gray-900 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {registering ? "Registering..." : "Add Passkey"}
          </Button>
        </div>

        {error && (
          <Alert className="border-red-500/50 bg-white/20 backdrop-blur-xl">
            <AlertDescription className="text-red-500">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/50 bg-white/20 backdrop-blur-xl">
            <AlertDescription className="text-green-500">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {loading ? (
            <Card className="bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
              <CardContent className="p-6">
                <div className="text-center flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  <span className="text-gray-600">Loading passkeys...</span>
                </div>
              </CardContent>
            </Card>
          ) : passkeys.length === 0 ? (
            <Card className="bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No passkeys found</h3>
                <p className="text-gray-600 mb-6">
                  Add a passkey to enable enhanced security for high-value transactions
                </p>
                <Button
                  onClick={registerPasskey}
                  disabled={registering}
                  variant="outline"
                  className="border-gray-300 text-gray-900 hover:bg-black hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {registering ? "Registering..." : "Add Your First Passkey"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            passkeys.map((passkey) => (
              <Card key={passkey.id} className="bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                        {getTransportIcon(passkey.transports)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {passkey.name || `Passkey ${passkey.id.slice(0, 8)}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Added {formatDate(passkey.createdAt)}
                          {passkey.lastUsedAt && (
                            <span className="ml-2">
                              • Last used {formatDate(passkey.lastUsedAt)}
                            </span>
                          )}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {passkey.transports.map((transport) => (
                            <Badge key={transport} variant="secondary" className="bg-white/30 text-gray-900 border-white/30 text-xs">
                              {transport}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => deletePasskey(passkey.id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {passkeys.length > 0 && (
          <Card className="bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                Security Benefits
              </CardTitle>
              <CardDescription className="text-gray-600">
                Passkeys provide enhanced security for your transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-white/30 rounded-xl border border-white/30">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-900">Required for high-value transactions ($3-$5 USDC)</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/30 rounded-xl border border-white/30">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-900">Biometric or PIN verification</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/30 rounded-xl border border-white/30">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-900">Resistant to phishing attacks</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}