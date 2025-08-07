'use client';

import { useState } from 'react';
import { OtpForm } from '@/components/ui/otp-input';
import { useOtp } from '@/hooks/use-otp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OtpDemoPage() {
  const [email, setEmail] = useState('test@example.com');
  const [selectedType, setSelectedType] = useState<'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN_VERIFICATION' | 'TRANSACTION_APPROVAL'>('EMAIL_VERIFICATION');
  const [showOtpForm, setShowOtpForm] = useState(false);

  const { sendOtp, verifyOtp, isLoading, isResendLoading } = useOtp({
    type: selectedType,
    email,
    onSuccess: () => {
      console.log('OTP verification successful!');
    },
    onError: (error) => {
      console.error('OTP error:', error);
    },
  });

  const handleSendOtp = async () => {
    await sendOtp();
    setShowOtpForm(true);
  };

  const handleVerifyOtp = async (code: string) => {
    const success = await verifyOtp(code);
    if (success) {
      setShowOtpForm(false);
    }
  };

  const handleResendOtp = async () => {
    await sendOtp();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              OTP System Demo
            </h1>
            <p className="text-lg text-gray-600">
              Test the email OTP functionality with Resend
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Set up your OTP test parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OTP Type</Label>
                  <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="EMAIL_VERIFICATION">Email Verification</TabsTrigger>
                      <TabsTrigger value="PASSWORD_RESET">Password Reset</TabsTrigger>
                    </TabsList>
                    <TabsList className="grid w-full grid-cols-2 mt-2">
                      <TabsTrigger value="LOGIN_VERIFICATION">Login Verification</TabsTrigger>
                      <TabsTrigger value="TRANSACTION_APPROVAL">Transaction Approval</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Button 
                  onClick={handleSendOtp}
                  disabled={isResendLoading}
                  className="w-full"
                >
                  {isResendLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </CardContent>
            </Card>

            {/* OTP Form Panel */}
            <Card>
              <CardHeader>
                <CardTitle>OTP Verification</CardTitle>
                <CardDescription>
                  Enter the verification code sent to your email
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showOtpForm ? (
                  <OtpForm
                    type={selectedType}
                    email={email}
                    onSubmit={handleVerifyOtp}
                    onResend={handleResendOtp}
                    isLoading={isLoading}
                    isResendLoading={isResendLoading}
                    resendCooldown={60}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Click "Send OTP" to start the verification process
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>OTP System Features</CardTitle>
              <CardDescription>
                What's included in this OTP implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Email Integration</h4>
                  <p className="text-sm text-gray-600">
                    Uses Resend for reliable email delivery with beautiful templates
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Security</h4>
                  <p className="text-sm text-gray-600">
                    Rate limiting, expiration times, and one-time use codes
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">User Experience</h4>
                  <p className="text-sm text-gray-600">
                    Modern UI with countdown timers and resend functionality
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Database Storage</h4>
                  <p className="text-sm text-gray-600">
                    Secure storage with automatic cleanup of expired codes
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Multiple Types</h4>
                  <p className="text-sm text-gray-600">
                    Support for email verification, password reset, login verification, and transaction approval
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Error Handling</h4>
                  <p className="text-sm text-gray-600">
                    Comprehensive error handling with user-friendly messages
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 