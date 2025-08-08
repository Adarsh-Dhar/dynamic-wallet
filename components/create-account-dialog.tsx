"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Wallet } from 'lucide-react'

interface CreateAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccountCreated: (account: any) => void
  existingAccountsCount: number
}

export default function CreateAccountDialog({
  open,
  onOpenChange,
  onAccountCreated,
  existingAccountsCount
}: CreateAccountDialogProps) {
  const [accountName, setAccountName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Set default account name when dialog opens
  useEffect(() => {
    if (open) {
      setAccountName(`Wallet ${existingAccountsCount + 1}`)
      setError("")
    }
  }, [open, existingAccountsCount])

  const handleCreateAccount = async () => {
    if (!accountName.trim()) {
      setError("Account name is required")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ label: accountName.trim() }),
      })

      console.log('Create account response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Created new account with address:', data.address)
        onAccountCreated(data.vault)
        onOpenChange(false)
      } else {
        const errorData = await response.json()
        console.error('Failed to create account:', errorData)
        setError(errorData.error || 'Failed to create account')
      }
    } catch (error) {
      console.error('Error creating account:', error)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleCreateAccount()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/20 border-white/20 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span>Create New Account</span>
          </DialogTitle>
          <DialogDescription className="text-gray-900">
            Create a new Ethereum wallet with a unique name. This will generate a new keypair for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name" className="text-gray-900">
              Account Name
            </Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter account name"
              className="bg-white/50 border-white/20 text-gray-900 placeholder:text-gray-500"
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-slate-900 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateAccount}
            disabled={loading || !accountName.trim()}
            className="bg-gradient-to-br from-orange-400 to-red-400 text-white hover:from-orange-500 hover:to-red-500"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}