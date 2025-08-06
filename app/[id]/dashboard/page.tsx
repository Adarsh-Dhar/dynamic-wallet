"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Eye, EyeOff, Settings, TrendingUp, Wallet, Send, Download, LogOut, Plus, Loader2 } from 'lucide-react'
import SendModal from "@/components/send-modal"
import ReceiveModal from "@/components/receive-modal"
import TransactionHistory from "@/components/transaction-history"
import MarketData from "@/components/market-data"
import CreateAccountDialog from "@/components/create-account-dialog"

interface Vault {
  id: string
  label: string
  address: string | null
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const router = useRouter()
  const params = useParams()
  const walletId = params.walletId as string
  
  const [showBalance, setShowBalance] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false)
  const [vaults, setVaults] = useState<Vault[]>([])
  const [selectedWallet, setSelectedWallet] = useState<Vault | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch vaults on component mount
  useEffect(() => {
    fetchVaults()
  }, [])

  // Set selected wallet when vaults are loaded or walletId changes
  useEffect(() => {
    if (vaults.length > 0 && walletId) {
      const wallet = vaults.find(vault => vault.id === walletId)
      setSelectedWallet(wallet || null)
    }
  }, [vaults, walletId])

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

  const handleWalletSelect = (vault: Vault) => {
    router.push(`/${params.id}/dashboard/${vault.id}/actions`)
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
              onClick={() => setShowCreateAccountDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Account
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
                      onClick={() => setShowCreateAccountDialog(true)}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vaults.map((vault) => (
                <Card 
                  key={vault.id} 
                  className={`bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer ${
                    selectedWallet?.id === vault.id ? 'ring-2 ring-blue-500 bg-slate-800/80' : ''
                  }`}
                  onClick={() => handleWalletSelect(vault)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white">{vault.label}</CardTitle>
                          <CardDescription className="text-slate-400">
                            {vault.address ? (
                              <div className="flex items-center space-x-2">
                                <span>{vault.address.slice(0, 6)}...{vault.address.slice(-4)}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="p-1 text-slate-400 hover:text-white"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(vault.address!)
                                  }}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span>No address</span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {selectedWallet?.id === vault.id ? 'Selected' : 'Active'}
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
                      <div className="pt-2">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleWalletSelect(vault)
                          }}
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Selected Wallet Overview - Only show if a wallet is selected */}
        {selectedWallet && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <span>{selectedWallet.label} Balance</span>
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
                    {selectedWallet.address ? (
                      <div className="flex items-center space-x-2">
                        <span>{selectedWallet.address}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1 text-slate-400 hover:text-white"
                          onClick={() => navigator.clipboard.writeText(selectedWallet.address!)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="italic text-slate-500">No address</span>
                    )}
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

        {/* Main Content Tabs - Only show if a wallet is selected */}
        {selectedWallet && (
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
      <CreateAccountDialog 
        open={showCreateAccountDialog} 
        onOpenChange={setShowCreateAccountDialog}
        onAccountCreated={handleAccountCreated}
        existingAccountsCount={vaults.length}
      />
    </div>
  )
}
