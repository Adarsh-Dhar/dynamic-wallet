import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  tokenId: string;
  userId: string;
  iat?: number;
  exp?: number;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT Token generation
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// Token verification
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
}

// Refresh token management
export async function createRefreshToken(userId: string): Promise<string> {
  // Clean up expired refresh tokens
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  const token = generateRefreshToken({
    tokenId: '', // Will be set after creation
    userId,
  });

  const refreshToken = await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Update the token with the actual ID
  const updatedToken = generateRefreshToken({
    tokenId: refreshToken.id,
    userId,
  });

  await prisma.refreshToken.update({
    where: { id: refreshToken.id },
    data: { token: updatedToken },
  });

  return updatedToken;
}

export async function validateRefreshToken(token: string): Promise<boolean> {
  const payload = verifyRefreshToken(token);
  if (!payload) return false;

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
  });

  if (!refreshToken || refreshToken.token !== token || refreshToken.expiresAt < new Date()) {
    return false;
  }

  return true;
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await prisma.refreshToken.delete({
    where: { id: tokenId },
  });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
} 