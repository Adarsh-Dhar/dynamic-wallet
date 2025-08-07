'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestResendPage() {
  const [email, setEmail] = useState('test@example.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleTestResend = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/otp/test-resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();
      console.log('Resend test response:', data);

      if (response.ok) {
        setResult('Resend API test successful! Check your email.');
      } else {
        setResult(`Resend API test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Resend test error:', error);
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
              Resend API Test
            </h1>
            <p className="text-lg text-gray-600">
              Test Resend API directly
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resend API Test</CardTitle>
              <CardDescription>
                Test the Resend API directly to verify email delivery
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
                  placeholder="Enter email address"
                />
              </div>

              <Button 
                onClick={handleTestResend}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing Resend...' : 'Test Resend API'}
              </Button>

              {result && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800">{result}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 