"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Shield, Smartphone, Monitor } from "lucide-react"
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Passkeys</h1>
          <p className="text-slate-400 mt-2">
            Manage your passkeys for enhanced security on high-value transactions
          </p>
        </div>
        <Button
          onClick={registerPasskey}
          disabled={registering}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {registering ? "Registering..." : "Add Passkey"}
        </Button>
      </div>

      {error && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-500/10">
          <AlertDescription className="text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {loading ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-center text-slate-400">Loading passkeys...</div>
            </CardContent>
          </Card>
        ) : passkeys.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No passkeys found</h3>
              <p className="text-slate-400 mb-4">
                Add a passkey to enable enhanced security for high-value transactions
              </p>
              <Button
                onClick={registerPasskey}
                disabled={registering}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {registering ? "Registering..." : "Add Your First Passkey"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          passkeys.map((passkey) => (
            <Card key={passkey.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getTransportIcon(passkey.transports)}
                    <div>
                      <h3 className="font-semibold text-white">
                        {passkey.name || `Passkey ${passkey.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Added {formatDate(passkey.createdAt)}
                        {passkey.lastUsedAt && (
                          <span className="ml-2">
                            • Last used {formatDate(passkey.lastUsedAt)}
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {passkey.transports.map((transport) => (
                          <Badge key={transport} variant="secondary" className="text-xs">
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
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Security Benefits</CardTitle>
            <CardDescription className="text-slate-400">
              Passkeys provide enhanced security for your transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-300">Required for high-value transactions ($3-$5 USDC)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-slate-300">Biometric or PIN verification</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-slate-300">Resistant to phishing attacks</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 