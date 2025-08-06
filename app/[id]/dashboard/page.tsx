"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Eye, EyeOff, Settings, TrendingUp, Wallet, Send, Download, LogOut, Plus, Loader2 } from 'lucide-react'
import SendModal from "@/components/send-modal"
import ReceiveModal from "@/components/receive-modal"
import TransactionHistory from "@/components/transaction-history"
import MarketData from "@/components/market-data"

interface Vault {
  id: string
  label: string
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const router = useRouter()
  const [showBalance, setShowBalance] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingAccount, setCreatingAccount] = useState(false)

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
      
      if (response.ok) {
        const data = await response.json()
        setVaults(data.vaults)
      } else {
        console.error('Failed to fetch vaults')
      }
    } catch (error) {
      console.error('Error fetching vaults:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewAccount = async () => {
    try {
      setCreatingAccount(true)
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ label: 'New Wallet' }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setVaults([data.vault, ...vaults])
      } else {
        console.error('Failed to create account')
      }
    } catch (error) {
      console.error('Error creating account:', error)
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
          <span className="text-white text-lg">Loading your accounts...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CryptoVault</h1>
              <p className="text-sm text-slate-400">Your Wallet</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-slate-700 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-300">Ethereum Mainnet</span>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Accounts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Your Accounts</h2>
            <Button 
              onClick={createNewAccount}
              disabled={creatingAccount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creatingAccount ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {creatingAccount ? 'Creating...' : 'Create Account'}
            </Button>
          </div>

          {vaults.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto">
                    <Wallet className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">No accounts yet</h3>
                    <p className="text-slate-400 mb-6">Create your first wallet to get started</p>
                    <Button 
                      onClick={createNewAccount}
                      disabled={creatingAccount}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {creatingAccount ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {creatingAccount ? 'Creating...' : 'Create Your First Account'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vaults.map((vault) => (
                <Card key={vault.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white">{vault.label}</CardTitle>
                          <CardDescription className="text-slate-400">
                            Created {new Date(vault.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Balance</span>
                        <span className="text-white font-medium">-</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Assets</span>
                        <span className="text-white font-medium">-</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Wallet Overview - Only show if user has accounts */}
        {vaults.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <span>Total Balance</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {/* Wallet address placeholder */}
                    <span className="italic text-slate-500">No address</span>
                    <Button variant="ghost" size="sm" className="ml-2 p-1 text-slate-400 hover:text-white">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setShowReceiveModal(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Receive
                  </Button>
                  <Button 
                    onClick={() => setShowSendModal(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {showBalance ? <span className="italic text-slate-500">No balance</span> : "••••••"}
              </div>
              <div className="flex items-center space-x-2 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm italic text-slate-500">No data</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs - Only show if user has accounts */}
        {vaults.length > 0 && (
          <Tabs defaultValue="assets" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
              <TabsTrigger value="assets" className="data-[state=active]:bg-slate-700">Assets</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700">Activity</TabsTrigger>
              <TabsTrigger value="market" className="data-[state=active]:bg-slate-700">Market</TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="space-y-4">
              <div className="grid gap-4">
                {/* No assets data available */}
                <div className="text-center text-slate-500 italic py-8">No assets to display</div>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <TransactionHistory />
            </TabsContent>

            <TabsContent value="market">
              <MarketData />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <SendModal open={showSendModal} onOpenChange={setShowSendModal} />
      <ReceiveModal open={showReceiveModal} onOpenChange={setShowReceiveModal} />
    </div>
  )
}
