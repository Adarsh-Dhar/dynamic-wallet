# JWT Authentication Setup

This crypto wallet app now includes a complete JWT-based authentication system with the following features:

## Features

- **Secure JWT Authentication**: Access tokens (15min) + Refresh tokens (7 days)
- **Password Hashing**: Using bcrypt with 12 salt rounds
- **HTTP-only Cookies**: Secure cookie-based token storage
- **Token Refresh**: Automatic token refresh mechanism
- **Protected Routes**: Middleware for API route protection
- **Database Integration**: PostgreSQL with Prisma ORM

## Environment Variables

Add these to your `.env` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cryptovault"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Environment
NODE_ENV="development"
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (protected)

### Protected Routes
Use the `withAuth` middleware to protect API routes:

```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function handler(request: AuthenticatedRequest) {
  const user = request.user!; // User is guaranteed to exist
  // Your protected logic here
}

export const GET = withAuth(handler);
```

## Database Schema

The authentication system uses these models:

### User
- `id`: UUID primary key
- `email`: Unique email address
- `passwordHash`: Bcrypt hashed password
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### RefreshToken
- `id`: UUID primary key
- `token`: JWT refresh token
- `userId`: Foreign key to User
- `expiresAt`: Token expiration
- `createdAt`: Timestamp

### Vault
- `id`: UUID primary key
- `userId`: Foreign key to User
- `label`: Wallet label
- `encryptedData`: Encrypted wallet data
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

## Security Features

1. **Password Security**: Bcrypt hashing with 12 salt rounds
2. **Token Security**: JWT with short-lived access tokens
3. **Cookie Security**: HTTP-only, secure, same-site cookies
4. **Token Rotation**: Refresh tokens are rotated on use
5. **Automatic Cleanup**: Expired refresh tokens are automatically removed

## Frontend Integration

The authentication system is designed to work with HTTP-only cookies, providing better security than localStorage. The frontend automatically includes credentials in requests and handles token refresh transparently.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pnpm add jsonwebtoken bcryptjs @types/jsonwebtoken
   ```

2. **Update Database Schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Set Environment Variables**: Add the required environment variables to your `.env` file

4. **Start Development Server**:
   ```bash
   pnpm dev
   ```

## Usage Example

```typescript
// Register a new user
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
});

// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
});

// Access protected route
const userData = await fetch('/api/auth/me', {
  credentials: 'include'
});
```

## Production Considerations

1. **Change JWT Secrets**: Use strong, unique secrets in production
2. **Use HTTPS**: Ensure all cookies are secure
3. **Database Security**: Use connection pooling and proper database security
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Logging**: Add proper logging for security events
6. **Monitoring**: Monitor for suspicious authentication patterns 