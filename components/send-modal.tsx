"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Scan, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { sendUSDC, getUSDCBalance, checkNetwork, switchToSepolia, USDCBalance } from "@/lib/usdc"
import { toast } from "sonner"

interface SendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaultId?: string
}

export default function SendModal({ open, onOpenChange, vaultId }: SendModalProps) {
  const [selectedAsset, setSelectedAsset] = useState("USDC")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<USDCBalance | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState("")

  const assets = [
    { symbol: "USDC", name: "USD Coin", balance: usdcBalance?.balance || "0", icon: "💵" },
  ]

  const selectedAssetData = assets.find(asset => asset.symbol === selectedAsset)

  // Fetch USDC balance when modal opens
  useEffect(() => {
    if (open && selectedAsset === "USDC" && vaultId) {
      fetchUSDCBalance()
    }
  }, [open, selectedAsset, vaultId])

  const fetchUSDCBalance = async () => {
    if (!vaultId) {
      setErrorMessage('No wallet selected')
      return
    }

    try {
      setBalanceLoading(true)
      setErrorMessage("")
      
      const balance = await getUSDCBalance(vaultId)
      setUsdcBalance(balance)
    } catch (error: any) {
      console.error('Failed to fetch USDC balance:', error)
      setErrorMessage(error.message || 'Failed to fetch balance')
    } finally {
      setBalanceLoading(false)
    }
  }

  const handleSend = async () => {
    if (!recipient || !amount) {
      toast.error("Please fill in all fields")
      return
    }

    if (!vaultId) {
      toast.error("No wallet selected")
      return
    }

    if (selectedAsset === "USDC") {
      await handleSendUSDC()
    }
  }

  const handleSendUSDC = async () => {
    if (!vaultId) {
      toast.error("No wallet selected")
      return
    }

    try {
      setLoading(true)
      setTransactionStatus('pending')
      setErrorMessage("")

      // Validate amount
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Invalid amount')
      }

      // Check if user has enough balance
      if (usdcBalance && parseFloat(usdcBalance.balance) < numAmount) {
        throw new Error('Insufficient USDC balance')
      }

      // Validate recipient address
      if (!recipient.startsWith('0x') || recipient.length !== 42) {
        throw new Error('Invalid recipient address')
      }

      // Send USDC
      const txHash = await sendUSDC(vaultId, amount, recipient)
      
      setTransactionStatus('success')
      toast.success(`USDC sent successfully! Transaction: ${txHash}`)
      
      // Reset form
      setRecipient("")
      setAmount("")
      
      // Refresh balance
      await fetchUSDCBalance()
      
      // Close modal after a delay
      setTimeout(() => {
        onOpenChange(false)
        setTransactionStatus('idle')
      }, 2000)
      
    } catch (error: any) {
      console.error('Failed to send USDC:', error)
      setTransactionStatus('error')
      setErrorMessage(error.message || 'Transaction failed')
      toast.error(error.message || 'Failed to send USDC')
    } finally {
      setLoading(false)
    }
  }

  const handleMaxAmount = () => {
    if (usdcBalance) {
      setAmount(usdcBalance.balance)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Send USDC</DialogTitle>
          <DialogDescription className="text-slate-400">
            Send USDC to another wallet address on Sepolia network
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Asset Selection */}
          <div className="space-y-2">
            <Label>Select Asset</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {assets.map((asset) => (
                  <SelectItem key={asset.symbol} value={asset.symbol}>
                    <div className="flex items-center space-x-2">
                      <span>{asset.icon}</span>
                      <span>{asset.symbol}</span>
                      <span className="text-slate-400">
                        {balanceLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin inline" />
                        ) : (
                          `(${asset.balance})`
                        )}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-600/50 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-200">{errorMessage}</span>
            </div>
          )}

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label>Recipient Address</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-slate-700 border-slate-600"
                disabled={loading}
              />
              <Button variant="outline" size="icon" className="border-slate-600" disabled={loading}>
                <Scan className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="space-y-2">
              <Input
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-700 border-slate-600"
                disabled={loading}
                type="number"
                step="0.000001"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>
                  Available: {balanceLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                  ) : (
                    `${usdcBalance?.balance || '0'} USDC`
                  )}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-400 p-0 h-auto"
                  onClick={handleMaxAmount}
                  disabled={loading || !usdcBalance}
                >
                  Max
                </Button>
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          {amount && recipient && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Network Fee</span>
                  <span>~$0.50</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total</span>
                  <span className="font-semibold">{amount} USDC</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction Status */}
          {transactionStatus === 'pending' && (
            <div className="flex items-center space-x-2 p-3 bg-blue-900/20 border border-blue-600/50 rounded-md">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-sm text-blue-200">Processing transaction...</span>
            </div>
          )}

          {transactionStatus === 'success' && (
            <div className="flex items-center space-x-2 p-3 bg-green-900/20 border border-green-600/50 rounded-md">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-200">Transaction successful!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1 border-slate-600"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleSend}
              disabled={loading || !recipient || !amount || transactionStatus === 'success' || !vaultId}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
