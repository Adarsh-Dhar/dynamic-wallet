// WebAuthn configuration constants
export const rpId = process.env.NODE_ENV === 'production' 
  ? 'your-domain.com' 
  : 'localhost';

export const rpName = 'CryptoVault';

export const origin = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com'
  : 'http://localhost:3000';

// WebAuthn options
export const webAuthnOptions = {
  timeout: 60000, // 60 seconds
  attestationType: 'none' as const,
  authenticatorSelection: {
    residentKey: 'discouraged' as const,
    userVerification: 'required' as const,
  },
  supportedAlgorithmIDs: [-7, -257], // ES256, RS256
}; 