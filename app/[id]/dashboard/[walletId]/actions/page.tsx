"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Eye, EyeOff, Send, Download, ArrowLeft, Wallet, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import SendModal from "@/components/send-modal"
import ReceiveModal from "@/components/receive-modal"
import { getUSDCBalance, checkNetwork, switchToSepolia, USDCBalance } from "@/lib/usdc"
import { toast } from "sonner"

interface Vault {
  id: string
  label: string
  address: string | null
  createdAt: string
  updatedAt: string
}

export default function WalletActions() {
  const router = useRouter()
  const params = useParams()
  const walletId = params.walletId as string
  
  const [showBalance, setShowBalance] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Vault | null>(null)
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<string>("")
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [usdcBalance, setUsdcBalance] = useState<USDCBalance | null>(null)
  const [usdcBalanceLoading, setUsdcBalanceLoading] = useState(false)

  // Fetch wallet data on component mount
  useEffect(() => {
    fetchWalletData()
  }, [walletId])

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/accounts', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        const wallet = data.vaults.find((vault: Vault) => vault.id === walletId)
        setSelectedWallet(wallet || null)
        
        if (wallet) {
          // In a real implementation, this would fetch actual balance from blockchain
          // For now, we'll show that balance is not available
          setBalanceLoading(false)
        }
      } else {
        if (response.status === 401) {
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUSDCBalance = async () => {
    try {
      setUsdcBalanceLoading(true)
      
      const balance = await getUSDCBalance(walletId)
      setUsdcBalance(balance)
    } catch (error: any) {
      console.error('Failed to fetch USDC balance:', error)
      toast.error('Failed to fetch USDC balance')
    } finally {
      setUsdcBalanceLoading(false)
    }
  }

  const handleBack = () => {
    router.push(`/dashboard/${params.id}`)
  }

  const copyAddress = () => {
    if (selectedWallet?.address) {
      navigator.clipboard.writeText(selectedWallet.address)
      toast.success('Address copied to clipboard')
    }
  }

  const viewOnExplorer = () => {
    if (selectedWallet?.address) {
      // Open in a new tab - you can customize the explorer URL based on your blockchain
      window.open(`https://sepolia.etherscan.io/address/${selectedWallet.address}`, '_blank')
    }
  }

  const handleRefreshBalance = () => {
    fetchUSDCBalance()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading wallet...</span>
        </div>
      </div>
    )
  }

  if (!selectedWallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">Wallet not found</h2>
          <p className="text-slate-400 mb-4">The requested wallet could not be found.</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{selectedWallet.label}</h1>
              <p className="text-slate-400 text-sm">Wallet Actions</p>
            </div>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">Wallet Balance</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshBalance}
                  disabled={usdcBalanceLoading}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <RefreshCw className={`w-4 h-4 ${usdcBalanceLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <CardDescription className="text-slate-400">
              {selectedWallet.address ? (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{selectedWallet.address}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 text-slate-400 hover:text-white"
                    onClick={copyAddress}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <span className="italic text-slate-500">No address</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* USDC Balance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💵</span>
                  <span className="text-white font-medium">USDC</span>
                </div>
                <div className="text-right">
                  {showBalance ? (
                    usdcBalanceLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-slate-400">Loading...</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-white">
                        {usdcBalance ? `${parseFloat(usdcBalance.balance).toFixed(2)} USDC` : '0.00 USDC'}
                      </div>
                    )
                  ) : (
                    <div className="text-2xl font-bold text-white">••••••</div>
                  )}
                </div>
              </div>

              {/* ETH Balance (placeholder) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⟠</span>
                  <span className="text-white font-medium">ETH</span>
                </div>
                <div className="text-right">
                  {showBalance ? (
                    balanceLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-slate-400">Loading...</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Balance not available</span>
                    )
                  ) : (
                    <div className="text-2xl font-bold text-white">••••••</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-slate-400 text-sm mt-4">
              Connect to Sepolia network to view real-time balances
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Send Button */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors cursor-pointer">
            <CardContent className="p-6" onClick={() => setShowSendModal(true)}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Send USDC</h3>
                  <p className="text-slate-400 text-sm">Send USDC to another wallet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receive Button */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors cursor-pointer">
            <CardContent className="p-6" onClick={() => setShowReceiveModal(true)}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Receive</h3>
                  <p className="text-slate-400 text-sm">Receive cryptocurrency from others</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-slate-400">
              Common wallet operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setShowSendModal(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Send USDC
              </Button>
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setShowReceiveModal(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Receive
              </Button>
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={copyAddress}
                disabled={!selectedWallet?.address}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={viewOnExplorer}
                disabled={!selectedWallet?.address}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <SendModal open={showSendModal} onOpenChange={setShowSendModal} vaultId={walletId} />
      <ReceiveModal open={showReceiveModal} onOpenChange={setShowReceiveModal} />
    </div>
  )
}
