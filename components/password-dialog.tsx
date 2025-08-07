import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordVerified: () => void;
  amount: number;
  toAddress: string;
  fromAddress?: string;
  riskLevel?: string;
}

export default function PasswordDialog({
  open,
  onOpenChange,
  onPasswordVerified,
  amount,
  toAddress,
  fromAddress,
  riskLevel = 'medium'
}: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { verifyPasswordForTransaction, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    
    try {
      const result = await verifyPasswordForTransaction(password, {
        amount,
        toAddress,
        fromAddress: fromAddress || '',
        riskLevel
      });
      
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

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'very-high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'extreme':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🟠';
      case 'very-high':
        return '🔴';
      case 'extreme':
        return '🟣';
      default:
        return '⚪';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-800/95 border-slate-700 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span>Verify Password</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Transaction Details */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Risk Level</span>
                <Badge className={getRiskLevelColor(riskLevel)}>
                  {getRiskLevelIcon(riskLevel)}
                  <span className="ml-1 capitalize">{riskLevel}</span>
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white font-medium">${amount} USDC</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">To Address</span>
                  <span className="text-white font-mono text-xs">
                    {toAddress.slice(0, 6)}...{toAddress.slice(-4)}
                  </span>
                </div>
                
                {fromAddress && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">From Address</span>
                    <span className="text-white font-mono text-xs">
                      {fromAddress.slice(0, 6)}...{fromAddress.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="flex items-start space-x-2 p-3 bg-blue-900/20 border border-blue-600/50 rounded-md">
            <Lock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-200 font-medium">Security Verification Required</p>
              <p className="text-blue-300 text-xs mt-1">
                This transaction requires password verification for your security.
              </p>
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoFocus
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !password.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify Password
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Security Tips */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>• Your password is never stored or transmitted in plain text</p>
            <p>• This verification is required for security compliance</p>
            <p>• You can cancel at any time to abort the transaction</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 