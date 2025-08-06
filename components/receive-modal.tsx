"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, QrCode, Share } from 'lucide-react'

interface ReceiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ReceiveModal({ open, onOpenChange }: ReceiveModalProps) {
  const walletAddress = "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Cryptocurrency</DialogTitle>
          <DialogDescription className="text-slate-400">
            Share your wallet address to receive crypto
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4">
                <div className="w-40 h-40 bg-gradient-to-br from-slate-800 to-slate-600 rounded flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-white" />
                </div>
              </div>
              <p className="text-sm text-slate-400 text-center">
                Scan this QR code with any wallet app
              </p>
            </CardContent>
          </Card>

          {/* Wallet Address */}
          <div className="space-y-2">
            <Label>Your Wallet Address</Label>
            <div className="flex space-x-2">
              <Input
                value={walletAddress}
                readOnly
                className="bg-slate-700 border-slate-600 font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={copyToClipboard}
                className="border-slate-600"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Warning */}
          <Card className="bg-yellow-900/20 border-yellow-600/50">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-200">
                ⚠️ Only send Ethereum and ERC-20 tokens to this address. 
                Sending other cryptocurrencies may result in permanent loss.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-slate-600">
              Close
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
