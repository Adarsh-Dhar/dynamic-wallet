import { Resend } from 'resend';
import { PrismaClient, OtpType } from '../../generated/prisma';
import { OtpEmailTemplate } from '../../../components/email-templates/otp-email';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export interface OtpStrategyConfig {
  codeLength?: number;
  expirationMinutes?: number;
  maxAttempts?: number;
  resendCooldownMinutes?: number;
}

export class OtpStrategy {
  private config: Required<OtpStrategyConfig>;

  constructor(config: OtpStrategyConfig = {}) {
    this.config = {
      codeLength: config.codeLength || 6,
      expirationMinutes: config.expirationMinutes || 10,
      maxAttempts: config.maxAttempts || 3,
      resendCooldownMinutes: config.resendCooldownMinutes || 1,
    };
  }

  /**
   * Generate a random OTP code
   */
  private generateOtpCode(): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < this.config.codeLength; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }

  /**
   * Ensure demo user exists in database and return the user ID to use
   */
  private async ensureDemoUser(userId: string, email: string): Promise<string> {
    // Check if this is a demo user (starts with 'demo-')
    if (!userId.startsWith('demo-')) {
      // This is a real user, not a demo user
      // Just verify the user exists and return the ID
      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (existingUser) {
          console.log('Real user found:', { userId, email: existingUser.email });
          return userId;
        } else {
          console.error('Real user not found:', { userId });
          throw new Error('User not found');
        }
      } catch (error) {
        console.error('Error looking up real user:', error);
        throw error;
      }
    }

    try {
      // Try to find the demo user by ID first
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (existingUser) {
        console.log('Demo user already exists:', { userId, email });
        return userId; // User already exists
      }

      // Check if the email already exists
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        console.log('Email already exists, using existing user for demo:', { userId, email, existingUserId: existingUserByEmail.id });
        // For demo purposes, we'll use the existing user's ID
        return existingUserByEmail.id;
      }

      // Create demo user with a unique email to avoid conflicts
      const demoEmail = `demo-${Date.now()}-${email}`;
      console.log('Creating demo user:', { userId, originalEmail: email, demoEmail });
      
      await prisma.user.create({
        data: {
          id: userId,
          email: demoEmail, // Use a unique demo email
          passwordHash: 'demo-password-hash', // Placeholder for demo users
        },
      });
      console.log('Demo user created successfully');
      return userId;
    } catch (error) {
      console.error('Error ensuring demo user exists:', error);
      // Don't throw here, as we want to continue with OTP creation
      // Instead, try to find an existing user with the same email
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });
        
        if (existingUser) {
          console.log('Using existing user for demo OTP:', { userId, email, existingUserId: existingUser.id });
          return existingUser.id;
        }
      } catch (fallbackError) {
        console.error('Fallback user lookup failed:', fallbackError);
      }
      
      // If all else fails, return the original userId
      return userId;
    }
  }

  /**
   * Create and store an OTP code in the database
   */
  private async createOtpCode(userId: string, type: OtpType): Promise<string> {
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + this.config.expirationMinutes * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });

    return code;
  }

  /**
   * Get email subject based on OTP type
   */
  private getEmailSubject(type: OtpType): string {
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
  }

  /**
   * Send OTP email using Resend
   */
  private async sendOtpEmail(email: string, code: string, type: OtpType): Promise<void> {
    const subject = this.getEmailSubject(type);
    
    console.log('Preparing to send email with:', {
      from: process.env.RESEND_FROM_EMAIL || 'noreply@adarsh.software',
      to: email,
      subject,
      code,
      type
    });

    // Create a simple HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
              ${subject}
            </h1>
            <p style="color: #666; margin: 0 0 20px 0; font-size: 16px; text-align: center;">
              Your verification code is:
            </p>
            <div style="
              background-color: #007bff; 
              color: white; 
              padding: 20px; 
              border-radius: 6px; 
              font-size: 28px; 
              font-weight: bold; 
              text-align: center; 
              letter-spacing: 6px; 
              margin: 20px 0;
              font-family: 'Courier New', monospace;
            ">
              ${code}
            </div>
            <p style="color: #666; margin: 20px 0; font-size: 14px; text-align: center;">
              This code will expire in ${this.config.expirationMinutes} minutes.
            </p>
            <p style="color: #999; margin: 20px 0 0 0; font-size: 12px; text-align: center;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@adarsh.software',
      to: [email],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
    
    console.log('Email sent successfully via Resend');
  }

  /**
   * Check if user has a recent OTP code to prevent spam
   */
  private async hasRecentOtp(userId: string, type: OtpType): Promise<boolean> {
    const cooldownTime = new Date(Date.now() - this.config.resendCooldownMinutes * 60 * 1000);
    
    const recentOtp = await prisma.otpCode.findFirst({
      where: {
        userId,
        type,
        createdAt: {
          gte: cooldownTime,
        },
        isUsed: false,
      },
    });

    return !!recentOtp;
  }

  /**
   * Send OTP code to user's email
   */
  async sendOtp(userId: string, email: string, type: OtpType): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Starting OTP send process for:', { userId, email, type });
      
      // Ensure demo user exists if this is a demo request
      const userToUse = await this.ensureDemoUser(userId, email);
      
      // Check if user has a recent OTP
      const hasRecent = await this.hasRecentOtp(userToUse, type);
      if (hasRecent) {
        console.log('User has recent OTP, returning cooldown message');
        return {
          success: false,
          message: `Please wait ${this.config.resendCooldownMinutes} minutes before requesting another code.`,
        };
      }

      // Create OTP code
      console.log('Creating OTP code...');
      const code = await this.createOtpCode(userToUse, type);
      console.log('OTP code created:', code);

      // Send email
      console.log('Sending OTP email...');
      await this.sendOtpEmail(email, code, type);
      console.log('OTP email sent successfully');

      return {
        success: true,
        message: 'OTP code sent successfully.',
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP code. Please try again.',
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(userId: string, code: string, type: OtpType): Promise<{ success: boolean; message: string }> {
    try {
      // Ensure demo user exists if this is a demo request
      const userToUse = await this.ensureDemoUser(userId, 'demo@example.com'); // Use placeholder email for demo users
      
      // Find the OTP code
      const otpCode = await prisma.otpCode.findFirst({
        where: {
          userId: userToUse,
          code,
          type,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpCode) {
        return {
          success: false,
          message: 'Invalid or expired OTP code.',
        };
      }

      // Mark OTP as used
      await prisma.otpCode.update({
        where: { id: otpCode.id },
        data: { isUsed: true },
      });

      return {
        success: true,
        message: 'OTP code verified successfully.',
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP code. Please try again.',
      };
    }
  }

  /**
   * Clean up expired OTP codes
   */
  async cleanupExpiredOtps(): Promise<void> {
    try {
      await prisma.otpCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  /**
   * Get OTP statistics for a user
   */
  async getUserOtpStats(userId: string): Promise<{
    totalCodes: number;
    usedCodes: number;
    expiredCodes: number;
    activeCodes: number;
  }> {
    const [totalCodes, usedCodes, expiredCodes, activeCodes] = await Promise.all([
      prisma.otpCode.count({ where: { userId } }),
      prisma.otpCode.count({ where: { userId, isUsed: true } }),
      prisma.otpCode.count({ 
        where: { 
          userId, 
          expiresAt: { lt: new Date() },
          isUsed: false 
        } 
      }),
      prisma.otpCode.count({ 
        where: { 
          userId, 
          expiresAt: { gt: new Date() },
          isUsed: false 
        } 
      }),
    ]);

    return {
      totalCodes,
      usedCodes,
      expiredCodes,
      activeCodes,
    };
  }
}

// Export a default instance
export const otpStrategy = new OtpStrategy();
