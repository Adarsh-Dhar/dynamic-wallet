import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Resend configuration...');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
    console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'Not set');

    // Test sending a simple email
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@adarsh.software',
      to: ['test@example.com'],
      subject: 'Test Email',
      html: '<p>This is a test email to verify Resend configuration.</p>',
    });

    if (error) {
      console.error('Resend test error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Resend configuration is working correctly'
    });

  } catch (error) {
    console.error('Resend test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 