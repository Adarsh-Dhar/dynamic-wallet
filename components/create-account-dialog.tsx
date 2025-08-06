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
      <DialogContent className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Create New Account</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new Ethereum wallet with a unique name. This will generate a new keypair for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name" className="text-white">
              Account Name
            </Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter account name"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateAccount}
            disabled={loading || !accountName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
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