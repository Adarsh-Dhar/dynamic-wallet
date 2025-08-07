# OTP System Implementation

This document describes the complete OTP (One-Time Password) system implementation using Resend for email delivery.

## Overview

The OTP system provides secure email-based verification with the following features:

- **Multiple OTP Types**: Email verification, password reset, login verification, and transaction approval
- **Rate Limiting**: Prevents spam with configurable cooldown periods
- **Expiration**: Automatic expiration of OTP codes
- **Beautiful Email Templates**: Professional-looking emails using React components
- **Database Storage**: Secure storage with automatic cleanup
- **Modern UI**: Clean, accessible interface with countdown timers

## Architecture

### Database Schema

The OTP system uses the following Prisma models:

```prisma
model OtpCode {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  code        String   // The OTP code
  type        OtpType  // Type of OTP
  expiresAt   DateTime // When the OTP expires
  isUsed      Boolean  @default(false) // Whether the OTP has been used
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([code])
  @@index([expiresAt])
}

enum OtpType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  LOGIN_VERIFICATION
  TRANSACTION_APPROVAL
}
```

### Core Components

1. **OTP Strategy** (`lib/approval/strategies/otp.ts`)
   - Handles OTP generation, sending, and verification
   - Manages rate limiting and expiration
   - Integrates with Resend for email delivery

2. **Email Template** (`components/email-templates/otp-email.tsx`)
   - React component for email rendering
   - Responsive design with professional styling
   - Supports different OTP types with appropriate messaging

3. **API Routes**
   - `/api/otp/send` - Send OTP codes
   - `/api/otp/verify` - Verify OTP codes

4. **UI Components**
   - `OtpInput` - Reusable OTP input component
   - `OtpForm` - Complete OTP verification form
   - `useOtp` - Custom hook for OTP functionality

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@adarsh.software

# Database
DATABASE_URL=your_database_url_here

# JWT Secrets (if using authentication)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
```

**Important**: Make sure your domain `adarsh.software` is verified in your Resend dashboard before testing.

### 2. Install Dependencies

```bash
pnpm add resend
```

### 3. Database Migration

```bash
npx prisma generate
npx prisma db push
```

## Usage

### Basic OTP Flow

```typescript
import { useOtp } from '@/hooks/use-otp';
import { OtpForm } from '@/components/ui/otp-input';

function MyComponent() {
  const { sendOtp, verifyOtp, isLoading, isResendLoading } = useOtp({
    type: 'EMAIL_VERIFICATION',
    email: 'user@example.com',
    onSuccess: () => {
      console.log('OTP verified successfully!');
    },
    onError: (error) => {
      console.error('OTP error:', error);
    },
  });

  return (
    <OtpForm
      type="EMAIL_VERIFICATION"
      email="user@example.com"
      onSubmit={verifyOtp}
      onResend={sendOtp}
      isLoading={isLoading}
      isResendLoading={isResendLoading}
    />
  );
}
```

### API Usage

#### Send OTP

```typescript
const response = await fetch('/api/otp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'EMAIL_VERIFICATION',
    email: 'user@example.com',
  }),
});
```

#### Verify OTP

```typescript
const response = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: '123456',
    type: 'EMAIL_VERIFICATION',
  }),
});
```

## Configuration

### OTP Strategy Configuration

```typescript
import { OtpStrategy } from '@/lib/approval/strategies/otp';

const otpStrategy = new OtpStrategy({
  codeLength: 6,              // Length of OTP codes
  expirationMinutes: 10,      // How long codes are valid
  maxAttempts: 3,             // Maximum verification attempts
  resendCooldownMinutes: 1,   // Cooldown between resends
});
```

### Email Template Customization

The email template can be customized by modifying `components/email-templates/otp-email.tsx`:

```typescript
export function OtpEmailTemplate({ code, type, expirationMinutes }: OtpEmailTemplateProps) {
  // Customize styling and content here
  return (
    <div style={{ /* your styles */ }}>
      {/* Your custom email content */}
    </div>
  );
}
```

## Security Features

### Rate Limiting
- Configurable cooldown periods between OTP requests
- Prevents spam and abuse

### Expiration
- OTP codes automatically expire after a configurable time
- Automatic cleanup of expired codes

### One-Time Use
- Each OTP code can only be used once
- Prevents replay attacks

### Database Security
- Secure storage with proper indexing
- Cascade deletion when users are removed

## Demo

Visit `/otp-demo` to see the OTP system in action. The demo page includes:

- Configuration panel for testing different OTP types
- Real-time OTP verification form
- Rate limiting demonstration
- Feature overview

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check your Resend API key
   - Verify the `RESEND_FROM_EMAIL` is configured
   - Ensure your domain is verified in Resend

2. **OTP verification failing**
   - Check if the code has expired
   - Verify the user is authenticated
   - Ensure the OTP type matches

3. **Rate limiting issues**
   - Wait for the cooldown period to expire
   - Check the configuration for cooldown settings

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_OTP=true
```

## API Reference

### OTP Strategy Methods

- `sendOtp(userId, email, type)` - Send OTP code
- `verifyOtp(userId, code, type)` - Verify OTP code
- `cleanupExpiredOtps()` - Clean up expired codes
- `getUserOtpStats(userId)` - Get user OTP statistics

### Hook Methods

- `sendOtp()` - Send OTP code
- `verifyOtp(code)` - Verify OTP code
- `isLoading` - Loading state for verification
- `isResendLoading` - Loading state for resend

## Contributing

When adding new OTP types:

1. Add the new type to the `OtpType` enum in the Prisma schema
2. Update the email template to handle the new type
3. Add appropriate validation in the API routes
4. Update the UI components to support the new type

## License

This OTP system is part of the crypto-wallet-mvp project. 