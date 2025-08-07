import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Testing Resend API with:', {
      from: process.env.RESEND_FROM_EMAIL || 'noreply@adarsh.software',
      to: email,
      subject: 'Resend API Test'
    });

    // Create a simple test email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resend API Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
              Resend API Test
            </h1>
            <p style="color: #666; margin: 0 0 20px 0; font-size: 16px; text-align: center;">
              This is a test email to verify that the Resend API is working correctly.
            </p>
            <div style="
              background-color: #28a745; 
              color: white; 
              padding: 20px; 
              border-radius: 6px; 
              font-size: 18px; 
              font-weight: bold; 
              text-align: center; 
              margin: 20px 0;
            ">
              ✅ Resend API is working!
            </div>
            <p style="color: #666; margin: 20px 0; font-size: 14px; text-align: center;">
              If you received this email, the Resend API is configured correctly.
            </p>
            <p style="color: #999; margin: 20px 0 0 0; font-size: 12px; text-align: center;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@adarsh.software',
      to: [email],
      subject: 'Resend API Test',
      html: htmlContent,
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json(
        { error: `Failed to send email: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('Resend API test successful');
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully via Resend API',
    });
  } catch (error) {
    console.error('Resend test error:', error);
    return NextResponse.json(
      { error: 'Failed to test Resend API' },
      { status: 500 }
    );
  }
} 