import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseOtpOptions {
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN_VERIFICATION' | 'TRANSACTION_APPROVAL';
  email: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useOtp({ type, email, onSuccess, onError }: UseOtpOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);

  const sendOtp = useCallback(async () => {
    setIsResendLoading(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast.success(data.message || 'OTP sent successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsResendLoading(false);
    }
  }, [type, email, onError]);

  const verifyOtp = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, type, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      toast.success(data.message || 'OTP verified successfully');
      onSuccess?.();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
      toast.error(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [type, email, onSuccess, onError]);

  return {
    sendOtp,
    verifyOtp,
    isLoading,
    isResendLoading,
  };
} 