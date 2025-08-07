'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestEmailPage() {
  const [email, setEmail] = useState('test@example.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleTestEmail = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type: 'EMAIL_VERIFICATION'
        }),
      });

      const data = await response.json();
      console.log('Email test response:', data);

      if (response.ok) {
        setResult('Email sent successfully! Check your inbox and spam folder.');
      } else {
        setResult(`Failed to send email: ${data.error}`);
      }
    } catch (error) {
      console.error('Email test error:', error);
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
              Email Test Page
            </h1>
            <p className="text-lg text-gray-600">
              Test email sending functionality
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Test</CardTitle>
              <CardDescription>
                Test sending OTP emails to verify the email system is working
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
                onClick={handleTestEmail}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending Email...' : 'Send Test Email'}
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