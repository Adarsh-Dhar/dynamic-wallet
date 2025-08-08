"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, QrCode, Share, AlertTriangle, ArrowDown } from 'lucide-react'

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
      <DialogContent className="bg-white/20 border-white/20 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-white" />
            </div>
            <span>Receive Cryptocurrency</span>
          </DialogTitle>
          <DialogDescription className="text-gray-900">
            Share your wallet address to receive crypto
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code */}
          <Card className="bg-white/50 border-white/20">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-48 h-48 bg-white/50 rounded-lg flex items-center justify-center mb-4 border border-white/20">
                <div className="w-40 h-40 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-lg flex items-center justify-center border border-white/20">
                  <QrCode className="w-20 h-20 text-gray-900" />
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Scan this QR code with any wallet app
              </p>
            </CardContent>
          </Card>

          {/* Wallet Address */}
          <div className="space-y-2">
            <Label className="text-gray-900">Your Wallet Address</Label>
            <div className="flex space-x-2">
              <Input
                value={walletAddress}
                readOnly
                className="bg-white/50 border-white/20 text-gray-900 font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={copyToClipboard}
                className="border-white/20 text-gray-600 hover:text-gray-900"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Warning */}
          <Alert className="bg-orange-100/80 border-orange-200 text-orange-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Only send Ethereum and ERC-20 tokens to this address. 
              Sending other cryptocurrencies may result in permanent loss.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="flex-1 text-slate-600 hover:text-gray-900"
            >
              Close
            </Button>
            <Button className="flex-1 bg-gradient-to-br from-orange-400 to-red-400 text-white hover:from-orange-500 hover:to-red-500">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
