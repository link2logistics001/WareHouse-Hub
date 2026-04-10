import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { sendVerificationEmail } from '@/lib/emailService';

/**
 * API Route to send a branded verification email
 * POST /api/auth/send-verification
 */
export async function POST(request) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Missing email or name' }, { status: 400 });
    }

    // 1. Generate the secure Firebase verification link
    // The link will redirect back to your app after verification
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
      handleCodeInApp: true,
    };

    const verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

    // 2. Send the custom branded email via Resend
    const result = await sendVerificationEmail(email, name, verificationLink);

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
