import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordVerified: () => void;
  amount: number;
  toAddress: string;
}

export default function PasswordDialog({
  open,
  onOpenChange,
  onPasswordVerified,
  amount,
  toAddress
}: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    
    try {
      const result = await verifyPassword(password);
      
      if (result.success) {
        toast.success('Password verified successfully');
        onPasswordVerified();
        setPassword('');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Password verification failed');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      toast.error('Password verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Verify Password</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Medium risk transaction requires password verification
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Amount: ${amount} USDC</p>
              <p>To: {toAddress.slice(0, 6)}...{toAddress.slice(-4)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !password.trim()}
                className="flex-1"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 