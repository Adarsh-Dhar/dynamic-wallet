"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Wallet, Settings, Activity, Shield, Loader2, LogOut, User, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react'
import CreateAccountDialog from "@/components/create-account-dialog"
import { useAuth } from "@/hooks/useAuth"

interface Vault {
  id: string;
  label: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const router = useRouter()
  const params = useParams()
  const { user, logout } = useAuth()
  const userId = params.id as string
  
  const [vaults, setVaults] = useState<Vault[]>([])
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch vaults on component mount
  useEffect(() => {
    fetchVaults()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Wallet className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-semibold text-white">CryptoVault Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-300 hover:text-white"
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
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Welcome back!
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage your crypto wallets and track your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wallet className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm font-medium">Total Wallets</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{vaults.length}</p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CreditCard className="w-4 h-4 text-green-400" />
                      <span className="text-white text-sm font-medium">Total Balance</span>
                    </div>
                    <p className="text-2xl font-bold text-white">$0.00</p>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-sm font-medium">24h Change</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">+0.00%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => setShowCreateAccountDialog(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Wallet
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-white hover:bg-slate-700 h-12"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    View Activity
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vaults.length === 0 ? (
                    <div className="text-center py-8">
                      <Wallet className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400">No wallets yet. Create your first wallet to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vaults.slice(0, 3).map((vault) => (
                        <div key={vault.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <Wallet className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{vault.label}</p>
                              <p className="text-slate-400 text-xs">
                                {vault.address ? `${vault.address.slice(0, 6)}...${vault.address.slice(-4)}` : 'Address not available'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWalletSelect(vault)}
                            className="text-blue-400 hover:text-blue-300"
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
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Your Wallets</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateAccountDialog(true)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {vaults.length === 0 ? (
                    <div className="text-center py-6">
                      <Wallet className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">No wallets yet</p>
                    </div>
                  ) : (
                    vaults.map((vault) => (
                      <div
                        key={vault.id}
                        onClick={() => handleWalletSelect(vault)}
                        className="p-3 rounded-lg cursor-pointer transition-colors bg-slate-700/50 hover:bg-slate-600/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium">{vault.label}</p>
                            <p className="text-slate-400 text-xs">
                              {vault.address ? `${vault.address.slice(0, 6)}...${vault.address.slice(-4)}` : 'Address not available'}
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security Overview */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Security Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="text-white text-sm">Account Security</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm">Backup Status</span>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Recommended</Badge>
                  </div>
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