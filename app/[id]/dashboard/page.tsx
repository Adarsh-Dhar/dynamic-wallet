"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Wallet, Settings, Activity, Shield, Loader2, LogOut, User, CreditCard, TrendingUp, AlertTriangle, Key } from 'lucide-react'
import CreateAccountDialog from "@/components/create-account-dialog"
import { useAuth } from "@/hooks/useAuth"

interface Vault {
  id: string;
  label: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

interface Passkey {
  id: string;
  name?: string;
  credentialID: string;
  lastUsedAt: string;
  createdAt: string;
  transports: string[];
}

export default function Dashboard() {
  const router = useRouter()
  const params = useParams()
  const { user, logout } = useAuth()
  const userId = params.id as string
  
  const [vaults, setVaults] = useState<Vault[]>([])
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch vaults and passkeys on component mount
  useEffect(() => {
    fetchVaults()
    fetchPasskeys()
  }, [])

  const fetchVaults = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/accounts', {
        credentials: 'include',
      })
      
      console.log('Fetch vaults response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Vaults data:', data)
        setVaults(data.vaults)
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch vaults:', errorData)
        if (response.status === 401) {
          console.error('Authentication failed - please login first')
          // Redirect to login page
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Error fetching vaults:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPasskeys = async () => {
    try {
      const response = await fetch('/api/auth/passkey/list')
      const data = await response.json()
      
      if (data.success) {
        setPasskeys(data.passkeys)
      } else {
        console.error('Failed to fetch passkeys:', data.error)
      }
    } catch (error) {
      console.error('Error fetching passkeys:', error)
    }
  }

  const handleAccountCreated = (newVault: Vault) => {
    setVaults([newVault, ...vaults])
    setShowCreateAccountDialog(false)
  }

  const handleWalletSelect = (vault: Vault) => {
    router.push(`/${userId}/dashboard/${vault.id}/actions`)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const handleCreatePasskey = () => {
    router.push(`/${userId}/dashboard/passkeys`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-900">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          </div>
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">CryptoVault Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Overview & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Card */}
            <Card className="bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span>Welcome back!</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your crypto wallets and track your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/30 rounded-xl border border-white/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                        <Wallet className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-900 text-sm font-medium">Total Wallets</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{vaults.length}</p>
                  </div>
                  <div className="p-4 bg-white/30 rounded-xl border border-white/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                        <CreditCard className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-900 text-sm font-medium">Total Balance</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">$0.00</p>
                  </div>
                  <div className="p-4 bg-white/30 rounded-xl border border-white/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-900 text-sm font-medium">24h Change</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">+0.00%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => setShowCreateAccountDialog(true)}
                    className="w-full bg-black hover:bg-gray-900 text-white h-12"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Wallet
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-900 hover:bg-gray-100 h-12"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    View Activity
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vaults.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-gray-600">No wallets yet. Create your first wallet to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vaults.slice(0, 3).map((vault) => (
                        <div key={vault.id} className="flex items-center justify-between p-3 bg-white/30 rounded-xl border border-white/30">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-gray-900 text-sm font-medium">{vault.label}</p>
                              <p className="text-gray-600 text-xs">
                                {vault.address ? `${vault.address.slice(0, 6)}...${vault.address.slice(-4)}` : 'Address not available'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWalletSelect(vault)}
                            className="text-gray-900 hover:bg-black hover:text-white"
                          >
                            Open
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Wallet List & Security */}
          <div className="space-y-6">
            {/* Wallet List */}
            <Card className="bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center justify-between">
                  <span>Your Wallets</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateAccountDialog(true)}
                    className="text-gray-900 hover:bg-black hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {vaults.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-gray-600 text-sm">No wallets yet</p>
                    </div>
                  ) : (
                    vaults.map((vault) => (
                      <div
                        key={vault.id}
                        onClick={() => handleWalletSelect(vault)}
                        className="p-3 rounded-xl cursor-pointer transition-colors bg-white/30 border border-white/30 hover:bg-white/40"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 text-sm font-medium">{vault.label}</p>
                            <p className="text-gray-600 text-xs">
                              {vault.address ? `${vault.address.slice(0, 6)}...${vault.address.slice(-4)}` : 'Address not available'}
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-red-400 rounded-full"></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security Overview */}
            <Card className="bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  Security Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/30 rounded-xl border border-white/30">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-900 text-sm">Account Security</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/50">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/30 rounded-xl border border-white/30">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                        <Key className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-900 text-sm">Passkey Security</span>
                    </div>
                    {passkeys.length > 0 ? (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/50">
                        {passkeys.length} Configured
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/50">Not Set</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/30 rounded-xl border border-white/30">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-900 text-sm">Backup Status</span>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/50">Recommended</Badge>
                  </div>

                  {passkeys.length === 0 && (
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-900 hover:bg-black hover:text-white h-12"
                      onClick={handleCreatePasskey}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Add Passkey
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateAccountDialog
        open={showCreateAccountDialog}
        onOpenChange={setShowCreateAccountDialog}
        onAccountCreated={handleAccountCreated}
        existingAccountsCount={vaults.length}
      />
    </div>
  )
} 