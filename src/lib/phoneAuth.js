/**
 * Phone Authentication Module
 *
 * Verifies phone number ownership using Firebase Phone Auth.
 * After OTP is confirmed we immediately sign out the temporary phone user
 * so the owner's email session is not replaced.
 *
 * ── Dev vs Production ──────────────────────────────────────────────────────
 * In development:  connectAuthEmulator (firebase.js) routes all auth calls
 *   to the local emulator on port 9099. The emulator requires no reCAPTCHA
 *   and generates OTPs visible in the Emulator UI at http://localhost:4000.
 *   Use any phone number — the emulator accepts all.
 *
 * In production:   Real invisible reCAPTCHA + real Firebase SMS.
 *
 * ── Session guard ──────────────────────────────────────────────────────────
 * signInWithPhoneNumber temporarily replaces the auth session with a
 * phone-credential user. phoneVerificationFlowActive tells AuthContext to
 * ignore those intermediate events so the dashboard never unmounts.
 */

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

let _confirmationResult = null;
let _recaptchaVerifier = null;

/** While true, AuthContext suppresses auth-state-changed reactions. */
export let phoneVerificationFlowActive = false;

/** Destroy any existing RecaptchaVerifier cleanly before creating a new one. */
function clearRecaptcha() {
  if (_recaptchaVerifier) {
    try { _recaptchaVerifier.clear(); } catch { /* already removed */ }
    _recaptchaVerifier = null;
  }
}

/**
 * Sends an OTP to the given phone number.
 *
 * Dev:  Emulator intercepts the call — OTP appears in localhost:4000 UI.
 * Prod: Real invisible reCAPTCHA → real Firebase SMS.
 *
 * @param {string} phoneNumber - E.164 format, e.g. "+919876543210"
 */
export async function sendPhoneOtp(phoneNumber) {
  clearRecaptcha();

  _recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    'expired-callback': clearRecaptcha,
  });

  phoneVerificationFlowActive = true;
  try {
    _confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, _recaptchaVerifier);
  } catch (error) {
    clearRecaptcha();
    _confirmationResult = null;
    throw formatPhoneError(error);
  } finally {
    phoneVerificationFlowActive = false;
  }
}

/**
 * Verifies the 6-digit OTP the user received.
 * Immediately signs out the temporary phone user on success so the
 * owner's email session is not permanently replaced.
 *
 * @param {string} otp
 * @returns {Promise<true>}
 */
export async function verifyPhoneOtp(otp) {
  if (!_confirmationResult) {
    throw new Error('No OTP session found. Please request a new OTP first.');
  }

  phoneVerificationFlowActive = true;
  try {
    await _confirmationResult.confirm(otp);
    await signOut(auth);
    _confirmationResult = null;
    clearRecaptcha();
    return true;
  } catch (error) {
    throw formatPhoneError(error);
  } finally {
    phoneVerificationFlowActive = false;
  }
}

/** Maps Firebase error codes to user-friendly strings. */
function formatPhoneError(error) {
  const code = error?.code || '';
  const map = {
    'auth/invalid-phone-number':
      'Invalid phone number. Use E.164 format, e.g. +91XXXXXXXXXX.',
    'auth/too-many-requests':
      'Too many attempts. Please wait a few minutes and try again.',
    'auth/invalid-verification-code':
      'Incorrect OTP. Please check and try again.',
    'auth/code-expired':
      'OTP expired. Please request a new one.',
    'auth/session-expired':
      'Session expired. Please request a new OTP.',
    'auth/missing-phone-number':
      'Phone number is required.',
    'auth/quota-exceeded':
      'SMS quota exceeded. Please try again later.',
    'auth/invalid-app-credential':
      'Verification failed. Make sure the Auth Emulator is running: npx firebase emulators:start --only auth',
    'auth/captcha-check-failed':
      'reCAPTCHA failed. Please refresh and try again.',
    'auth/network-request-failed':
      'Network error. Please check your connection and try again.',
    'auth/operation-not-allowed':
      'Phone authentication is not enabled in Firebase Console.',
  };
  const message = map[code] || error.message || 'Something went wrong. Please try again.';
  const err = new Error(message);
  err.code = code;
  return err;
}
