# Quick OTP Setup Guide

## 1. Get Your Resend API Key

1. Go to [Resend.com](https://resend.com)
2. Sign up/Login to your account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

## 2. Update Environment Variables

Add this to your `.env` file:

```env
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@adarsh.software
```

## 3. Verify Your Domain

1. In your Resend dashboard, go to Domains
2. Add `adarsh.software` as a domain
3. Follow the DNS verification steps
4. Wait for verification to complete

## 4. Test the System

1. Start your development server: `pnpm dev`
2. Visit `http://localhost:3000/otp-demo`
3. Enter your email address
4. Click "Send OTP"
5. Check your email for the verification code

## Troubleshooting

### Email Not Sending
- Check your Resend API key is correct
- Ensure your domain is verified in Resend
- Check the browser console for error messages

### OTP Verification Failing
- Make sure you're using the correct code from your email
- Codes expire after 10 minutes
- You can only use each code once

### Rate Limiting
- Wait 1 minute between OTP requests
- This prevents spam and abuse

## Demo Features

The demo page at `/otp-demo` includes:
- ✅ Email verification OTP
- ✅ Password reset OTP  
- ✅ Login verification OTP
- ✅ Transaction approval OTP
- ✅ Rate limiting demonstration
- ✅ Countdown timers
- ✅ Resend functionality

## Production Use

For production, make sure to:
1. Use proper authentication
2. Set up proper error monitoring
3. Configure email templates for your brand
4. Set up proper logging
5. Use environment-specific configurations 