# WebAuthn/Passkey Implementation for Crypto Wallet MVP

This document describes the WebAuthn/passkey implementation for enhanced security on high-value transactions in the crypto wallet MVP.

## Overview

The WebAuthn implementation provides:
- **Passkey Registration**: Users can register biometric or PIN-based passkeys
- **Enhanced Security**: High-value transactions ($3-$5 USDC) require passkey verification
- **Phishing Resistance**: Passkeys are resistant to phishing attacks
- **User-Friendly**: Seamless integration with device biometrics

## Architecture

### Database Schema

```sql
-- Passkey table for storing WebAuthn credentials
model Passkey {
  id                    String   @id @default(uuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  credentialID          String   @unique // Base64URL encoded credential ID
  credentialPublicKey   String   // Base64URL encoded public key
  counter               Int      @default(0)
  transports            String[] // Array of transport types (usb, nfc, ble, internal)
  name                  String?  // Optional name for the passkey
  lastUsedAt            DateTime @default(now())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([userId])
  @@index([credentialID])
}
```

### Key Components

1. **WebAuthn Service** (`lib/webauthn/simple-service.ts`)
   - Handles passkey registration and authentication
   - Manages credential storage and verification
   - Provides simplified WebAuthn operations

2. **Passkey Strategy** (`lib/approval/strategies/passkey.ts`)
   - Integrates with the approval system
   - Determines when passkey verification is required
   - Handles transaction-specific passkey verification

3. **API Endpoints**
   - `/api/auth/passkey/register` - Generate registration options
   - `/api/auth/passkey/verify` - Verify registration
   - `/api/auth/passkey/authenticate` - Generate auth options & verify
   - `/api/auth/passkey/list` - List user's passkeys
   - `/api/auth/passkey/delete` - Delete a passkey

4. **UI Components**
   - Passkey management page (`app/[id]/dashboard/passkeys/page.tsx`)
   - Passkey verification modal (`components/PasskeyVerification.tsx`)

## Implementation Details

### Registration Flow

1. **User initiates registration** on the passkeys page
2. **Server generates options** with user info and challenge
3. **Client calls WebAuthn API** to create credential
4. **Server verifies response** and stores passkey data
5. **Passkey is registered** and available for future transactions

### Authentication Flow

1. **High-value transaction** triggers passkey requirement
2. **Server generates auth options** with user's passkeys
3. **Client calls WebAuthn API** to authenticate
4. **Server verifies response** and updates counter
5. **Transaction proceeds** if verification succeeds

### Integration with Approval System

The passkey system integrates with the existing approval system:

```typescript
// High-risk transactions require passkey verification
const requiresPasskey = await passkeyVerificationService.checkPasskeyRequirement(userId, amount);

// If passkey is required but not verified, block transaction
if (requiresPasskey && !passkeyVerified) {
  return {
    ...approvalResponse,
    requiresPasskey: true,
    passkeyVerified: false,
    message: 'Passkey verification required for this transaction'
  };
}
```

## Security Features

### Risk-Based Verification
- **Amount Threshold**: Transactions $3-$5 USDC require passkey
- **User Verification**: Biometric or PIN verification required
- **Counter Tracking**: Prevents replay attacks
- **Transport Security**: Supports secure transport methods

### Anti-Phishing Protection
- **Origin Verification**: Ensures requests come from legitimate domain
- **RP ID Validation**: Validates relying party identity
- **Challenge Verification**: Prevents replay attacks

## Usage Examples

### Registering a Passkey

```typescript
// 1. Generate registration options
const optionsResponse = await fetch('/api/auth/passkey/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: user.email }),
});

// 2. Start registration on client
const credential = await startRegistration(optionsResponse.data);

// 3. Verify registration
const verifyResponse = await fetch('/api/auth/passkey/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    credential,
    challenge: optionsResponse.data.challenge,
  }),
});
```

### Verifying During Transaction

```typescript
// 1. Check if passkey is required
const requiresPasskey = await passkeyVerificationService.checkPasskeyRequirement(userId, amount);

if (requiresPasskey) {
  // 2. Generate authentication options
  const authOptions = await fetch('/api/auth/passkey/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  // 3. Authenticate with passkey
  const credential = await startAuthentication(authOptions.data);

  // 4. Verify authentication
  const verifyResponse = await fetch('/api/auth/passkey/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credential,
      challenge: authOptions.data.challenge,
    }),
  });
}
```

## Configuration

### Environment Variables

```env
# WebAuthn Configuration
NODE_ENV=development  # Affects rpId and origin settings
```

### WebAuthn Constants

```typescript
// lib/webauthn/constants.ts
export const rpId = process.env.NODE_ENV === 'production' 
  ? 'your-domain.com' 
  : 'localhost';

export const rpName = 'CryptoVault';

export const origin = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com'
  : 'http://localhost:3000';
```

## Browser Support

The implementation supports modern browsers with WebAuthn support:
- Chrome 67+
- Firefox 60+
- Safari 13+
- Edge 18+

## Security Considerations

### Production Deployment

1. **HTTPS Required**: WebAuthn only works over HTTPS
2. **Domain Configuration**: Update `rpId` and `origin` for production
3. **Challenge Storage**: Use secure session storage (Redis recommended)
4. **Error Handling**: Implement proper error handling and logging

### Best Practices

1. **User Education**: Explain passkey benefits to users
2. **Fallback Options**: Provide alternative verification methods
3. **Graceful Degradation**: Handle unsupported browsers gracefully
4. **Privacy**: Minimize data collection and storage

## Testing

### Local Development

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Register a passkey**:
   - Navigate to `/dashboard/passkeys`
   - Click "Add Passkey"
   - Follow the browser's WebAuthn flow

3. **Test high-value transaction**:
   - Attempt to send $3-$5 USDC
   - Verify passkey requirement appears
   - Complete passkey authentication

### Browser Testing

Test with different browsers and devices:
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Security Keys**: USB security keys

## Troubleshooting

### Common Issues

1. **"Not supported" error**:
   - Ensure HTTPS is enabled
   - Check browser WebAuthn support
   - Verify domain configuration

2. **Registration fails**:
   - Check browser console for errors
   - Verify server endpoint responses
   - Ensure proper challenge handling

3. **Authentication fails**:
   - Verify passkey exists for user
   - Check credential ID matching
   - Ensure proper counter handling

### Debug Mode

Enable debug logging by setting:
```typescript
console.log('WebAuthn debug:', { options, credential, verification });
```

## Future Enhancements

1. **Multi-device Support**: Allow multiple passkeys per user
2. **Backup Methods**: Implement passkey backup and recovery
3. **Advanced Policies**: Configurable risk-based policies
4. **Analytics**: Track passkey usage and security metrics
5. **Integration**: Connect with external identity providers

## Dependencies

```json
{
  "@simplewebauthn/browser": "^13.1.2",
  "@simplewebauthn/server": "^13.1.2",
  "@simplewebauthn/typescript-types": "^8.3.4"
}
```

## Conclusion

The WebAuthn implementation provides a secure, user-friendly authentication method for high-value transactions. It integrates seamlessly with the existing approval system while providing enhanced security through biometric or PIN-based verification.

For production deployment, ensure proper HTTPS configuration, domain setup, and comprehensive testing across different browsers and devices. 