'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestVeryHighDebugPage() {
  const [amount, setAmount] = useState('6');
  const [recipient, setRecipient] = useState('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
  const [passkeyVerified, setPasskeyVerified] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleTestApproval = async () => {
    setLoading(true);
    setResult('');

    try {
      const requestBody = {
        amount: parseFloat(amount),
        toAddress: recipient,
        fromAddress: 'test-vault',
        userCountry: 'US',
        deviceFingerprint: 'test-device',
        ipAddress: '192.168.1.1',
        passkeyVerified,
        otpCode: otpCode || undefined
      };

      console.log('Testing approval with:', requestBody);

      const response = await fetch('/api/usdc/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Approval response:', data);

      if (response.ok) {
        setResult(JSON.stringify(data, null, 2));
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult(`Error: ${error}`);
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
              Very High Risk Debug
            </h1>
            <p className="text-lg text-gray-600">
              Debug the very high risk approval logic
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Very High Risk Debug Test</CardTitle>
              <CardDescription>
                Test the very high risk approval logic with different parameters
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
                  placeholder="Enter amount"
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

              <div className="space-y-2">
                <Label htmlFor="otpCode">OTP Code (optional)</Label>
                <Input
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter OTP code if available"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="passkeyVerified"
                  checked={passkeyVerified}
                  onChange={(e) => setPasskeyVerified(e.target.checked)}
                />
                <Label htmlFor="passkeyVerified">Passkey Verified</Label>
              </div>

              <Button 
                onClick={handleTestApproval}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Approval Logic'}
              </Button>

              {result && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <pre className="text-sm text-blue-800 overflow-auto">{result}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 