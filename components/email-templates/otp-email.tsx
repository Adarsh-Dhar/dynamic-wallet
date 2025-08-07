import * as React from 'react';

interface OtpEmailTemplateProps {
  code: string;
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN_VERIFICATION' | 'TRANSACTION_APPROVAL';
  expirationMinutes: number;
}

export function OtpEmailTemplate({ code, type, expirationMinutes }: OtpEmailTemplateProps) {
  const getEmailSubject = (type: string): string => {
    switch (type) {
      case 'EMAIL_VERIFICATION':
        return 'Verify your email address';
      case 'PASSWORD_RESET':
        return 'Reset your password';
      case 'LOGIN_VERIFICATION':
        return 'Login verification code';
      case 'TRANSACTION_APPROVAL':
        return 'Transaction approval code';
      default:
        return 'Your verification code';
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h1 style={{ color: '#333', margin: '0 0 20px 0', fontSize: '24px' }}>
          {getEmailSubject(type)}
        </h1>
        
        <p style={{ color: '#666', margin: '0 0 20px 0', fontSize: '16px' }}>
          Your verification code is:
        </p>
        
        <div style={{ 
          backgroundColor: '#007bff', 
          color: 'white', 
          padding: '15px 20px', 
          borderRadius: '6px', 
          fontSize: '24px', 
          fontWeight: 'bold',
          textAlign: 'center',
          letterSpacing: '4px',
          margin: '20px 0'
        }}>
          {code}
        </div>
        
        <p style={{ color: '#666', margin: '20px 0', fontSize: '14px' }}>
          This code will expire in {expirationMinutes} minutes.
        </p>
        
        <p style={{ color: '#999', margin: '20px 0 0 0', fontSize: '12px' }}>
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    </div>
  );
} 