"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Scan } from 'lucide-react'

interface SendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SendModal({ open, onOpenChange }: SendModalProps) {
  const [selectedAsset, setSelectedAsset] = useState("ETH")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")

  const assets = [
    { symbol: "ETH", name: "Ethereum", balance: 1.2345, icon: "⟠" },
    { symbol: "BTC", name: "Bitcoin", balance: 0.0123, icon: "₿" },
    { symbol: "USDC", name: "USD Coin", balance: 150.00, icon: "💵" },
  ]

  const selectedAssetData = assets.find(asset => asset.symbol === selectedAsset)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Send Cryptocurrency</DialogTitle>
          <DialogDescription className="text-slate-400">
            Send crypto to another wallet address
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
                      <span className="text-slate-400">({asset.balance})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label>Recipient Address</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="0x... or ENS name"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
              <Button variant="outline" size="icon" className="border-slate-600">
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
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>Available: {selectedAssetData?.balance} {selectedAsset}</span>
                <Button variant="ghost" size="sm" className="text-blue-400 p-0 h-auto">
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
                  <span>~$2.50</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total</span>
                  <span className="font-semibold">{amount} {selectedAsset}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-slate-600">
              Cancel
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              <ArrowRight className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
