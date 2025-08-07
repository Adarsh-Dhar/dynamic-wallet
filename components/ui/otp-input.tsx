import * as React from 'react';
import { OTPInput } from 'input-otp';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  className,
  placeholder = '0',
}: OtpInputProps) {
  return (
    <div className={cn('flex justify-center', className)}>
      <OTPInput
        value={value}
        onChange={onChange}
        maxLength={length}
        disabled={disabled}
        render={({ slots }) => (
          <div className="flex gap-2">
            {slots.map((slot, index) => {
              // Filter out props that shouldn't be passed to DOM elements
              const { placeholderChar, isActive, hasFakeCaret, ...inputProps } = slot;
              return (
                <input
                  key={index}
                  {...inputProps}
                  className={cn(
                    'h-12 w-12 text-lg font-semibold text-center',
                    'border-2 border-gray-300 rounded-lg',
                    'focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-200'
                  )}
                  placeholder={placeholder}
                />
              );
            })}
          </div>
        )}
      />
    </div>
  );
}

interface OtpFormProps {
  onSubmit: (code: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  isResendLoading?: boolean;
  resendDisabled?: boolean;
  resendCooldown?: number;
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN_VERIFICATION' | 'TRANSACTION_APPROVAL';
  email?: string;
}

export function OtpForm({
  onSubmit,
  onResend,
  isLoading = false,
  isResendLoading = false,
  resendDisabled = false,
  resendCooldown = 60,
  type,
  email,
}: OtpFormProps) {
  const [otp, setOtp] = React.useState('');
  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      onSubmit(otp);
    }
  };

  const handleResend = () => {
    onResend();
    setCountdown(resendCooldown);
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'EMAIL_VERIFICATION':
        return 'Email Verification';
      case 'PASSWORD_RESET':
        return 'Password Reset';
      case 'LOGIN_VERIFICATION':
        return 'Login Verification';
      case 'TRANSACTION_APPROVAL':
        return 'Transaction Approval';
      default:
        return 'Verification';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {getTypeLabel()}
        </h2>
        <p className="text-gray-600">
          We've sent a verification code to{' '}
          <span className="font-medium text-gray-900">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
            className="justify-center"
          />
          
          {otp.length === 6 && (
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg',
                'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200'
              )}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled || isResendLoading || countdown > 0}
            className={cn(
              'text-sm font-medium text-blue-600 hover:text-blue-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
          >
            {countdown > 0
              ? `Resend in ${countdown}s`
              : isResendLoading
              ? 'Sending...'
              : 'Resend Code'}
          </button>
        </div>
      </form>
    </div>
  );
} 