/**
 * send-verification/route.js — Email Verification API Endpoint
 *
 * Next.js API Route (App Router) that sends a branded verification email
 * to a newly registered user.
 *
 * Endpoint: POST /api/auth/send-verification
 *
 * Request body:
 *  - email (string): The user's email address
 *  - name (string): The user's display name (for personalization)
 *
 * Flow:
 *  1. Validates that both email and name are provided
 *  2. Uses Firebase Admin SDK to generate a secure email verification link
 *     (the link redirects back to the app after verification)
 *  3. Sends the verification link inside a branded HTML email via Resend
 *  4. Returns success/error response
 *
 * Dependencies:
 *  - Firebase Admin SDK (server-side): Generates the secure verification link
 *  - Resend: Third-party email service for sending branded HTML emails
 *
 * Note: This runs on the server (Next.js API route), NOT in the browser.
 * The Firebase Admin SDK requires server-side credentials (private key).
 */

import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { sendVerificationEmail } from '@/lib/emailService';

/**
 * POST handler — Generates a Firebase verification link and sends it
 * via a branded email through Resend.
 *
 * @param {Request} request — The incoming POST request with { email, name }
 * @returns {NextResponse} JSON response with success flag or error message
 */
export async function POST(request) {
  try {
    // Parse the request body
    const { email, name } = await request.json();

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json({ error: 'Missing email or name' }, { status: 400 });
    }

    // 1. Generate the secure Firebase verification link
    // The actionCodeSettings determine where the user is redirected after
    // clicking the link. Use the app root with a query param instead of '/login'
    // so users are not sent to a missing route (this app has no /login page —
    // the login form lives at /#login on the home page).
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?mode=verify-email`,
      handleCodeInApp: true,  // Opens in the app instead of a Firebase-hosted page
    };

    // Use Firebase Admin SDK to generate the verification link
    // This creates a unique, time-limited link that verifies the user's email
    const verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

    // 2. Send the custom branded email via Resend
    // This replaces Firebase's default plain-text verification email with
    // a professionally designed HTML email matching the Link2Logistics brand
    const result = await sendVerificationEmail(email, name, verificationLink);

    // Check if Resend encountered an error
    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
