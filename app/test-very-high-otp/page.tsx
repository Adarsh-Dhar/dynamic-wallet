'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OtpForm } from '@/components/ui/otp-input';

export default function TestVeryHighOtpPage() {
  const [amount, setAmount] = useState('6');
  const [recipient, setRecipient] = useState('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTestVeryHighRisk = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Test very high risk approval
      const response = await fetch('/api/usdc/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(amount),
          toAddress: recipient,
          fromAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          userCountry: 'US',
          deviceFingerprint: 'test-device-123',
          ipAddress: '192.168.1.1'
        }),
      });

      const data = await response.json();
      console.log('Approval response:', data);

      if (response.ok) {
        if (data.requiresOTP) {
          setMessage('Very high risk transaction requires OTP. Sending OTP to your email...');
          setShowOtpForm(true);
          
          // Send OTP
          const otpResponse = await fetch('/api/otp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          const otpData = await otpResponse.json();
          console.log('OTP send response:', otpData);

          if (otpResponse.ok) {
            setMessage('OTP sent successfully! Check your email.');
          } else {
            setMessage(`Failed to send OTP: ${otpData.error}`);
          }
        } else {
          setMessage(`Approval result: ${JSON.stringify(data, null, 2)}`);
        }
      } else {
        setMessage(`Approval failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (code: string) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      console.log('OTP verify response:', data);

      if (response.ok) {
        setMessage('OTP verified successfully! Transaction approved.');
        setShowOtpForm(false);
      } else {
        setMessage(`OTP verification failed: ${data.error}`);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Test Very High Risk OTP
            </h1>
            <p className="text-lg text-gray-600">
              Test the very high risk approval flow with OTP
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Very High Risk Transaction Test</CardTitle>
              <CardDescription>
                Test a transaction that requires OTP verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDC)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (5-7 USDC for very high risk)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter recipient address"
                />
              </div>

              <Button 
                onClick={handleTestVeryHighRisk}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Very High Risk Approval'}
              </Button>

              {message && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800">{message}</p>
                </div>
              )}

              {showOtpForm && (
                <div className="mt-6">
                  <OtpForm
                    type="TRANSACTION_APPROVAL"
                    email="test@example.com"
                    onSubmit={handleOtpSubmit}
                    onResend={() => handleTestVeryHighRisk()}
                    isLoading={loading}
                    isResendLoading={loading}
                    resendCooldown={60}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 