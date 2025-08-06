"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownLeft, Copy, Eye, EyeOff, Settings, TrendingUp, Wallet, QrCode, Send, Download, LogOut } from 'lucide-react'
import SendModal from "@/components/send-modal"
import ReceiveModal from "@/components/receive-modal"
import TransactionHistory from "@/components/transaction-history"
import MarketData from "@/components/market-data"

export default function Dashboard() {
  const router = useRouter()
  const [showBalance, setShowBalance] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)

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

  const walletAddress = "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4"
  const totalBalance = 2847.32

  const assets = [
    { symbol: "ETH", name: "Ethereum", balance: 1.2345, value: 2234.56, change: 5.2, icon: "⟠" },
    { symbol: "BTC", name: "Bitcoin", balance: 0.0123, value: 456.78, change: -2.1, icon: "₿" },
    { symbol: "USDC", name: "USD Coin", balance: 150.00, value: 150.00, change: 0.1, icon: "💵" },
    { symbol: "UNI", name: "Uniswap", balance: 12.5, value: 89.25, change: 8.7, icon: "🦄" }
  ]

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
        {/* Wallet Overview */}
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
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
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
              {showBalance ? `$${totalBalance.toLocaleString()}` : "••••••"}
            </div>
            <div className="flex items-center space-x-2 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+$127.45 (4.7%) today</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="assets" className="data-[state=active]:bg-slate-700">Assets</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700">Activity</TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-slate-700">Market</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            <div className="grid gap-4">
              {assets.map((asset) => (
                <Card key={asset.symbol} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg">
                          {asset.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{asset.symbol}</div>
                          <div className="text-sm text-slate-400">{asset.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {showBalance ? `$${asset.value.toFixed(2)}` : "••••"}
                        </div>
                        <div className="text-sm text-slate-400">
                          {showBalance ? `${asset.balance} ${asset.symbol}` : "••••"}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={asset.change >= 0 ? "default" : "destructive"}
                          className={asset.change >= 0 ? "bg-green-600" : "bg-red-600"}
                        >
                          {asset.change >= 0 ? "+" : ""}{asset.change}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="market">
            <MarketData />
          </TabsContent>
        </Tabs>
      </div>

      <SendModal open={showSendModal} onOpenChange={setShowSendModal} />
      <ReceiveModal open={showReceiveModal} onOpenChange={setShowReceiveModal} />
    </div>
  )
}
