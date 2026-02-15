# Firebase Email Verification Setup Guide

This guide will help you enable and configure email verification in Firebase for the WareHouse Hub application.

## Prerequisites
- A Firebase project already set up
- Firebase Authentication enabled in your project
- Admin access to Firebase Console

---

## Step 1: Enable Email Verification in Firebase Console

### 1.1 Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **WareHouse Hub** project
3. Navigate to **Authentication** from the left sidebar

### 1.2 Enable Email/Password Authentication (if not already enabled)
1. Click on the **Sign-in method** tab
2. Find **Email/Password** in the providers list
3. Click on it and toggle **Enable** to ON
4. Click **Save**

---

## Step 2: Configure Email Verification Settings

### 2.1 Customize Email Templates
1. In the **Authentication** section, click on the **Templates** tab
2. Select **Email address verification** from the template types
3. You can customize:
   - **Sender name**: Enter your app name (e.g., "WareHouse Hub")
   - **From email**: This will be `noreply@<your-project-id>.firebaseapp.com` by default
   - **Reply-to email**: Add your support email (optional)
   - **Subject**: Customize the email subject (e.g., "Verify your WareHouse Hub email")
   - **Email body**: Customize the message (keep the `%LINK%` placeholder for the verification link)

### 2.2 Example Email Template
```
Subject: Verify Your WareHouse Hub Account

Hi there!

Thank you for signing up for WareHouse Hub. Please verify your email address by clicking the link below:

%LINK%

If you didn't create an account with WareHouse Hub, you can safely ignore this email.

Best regards,
The WareHouse Hub Team
```

4. Click **Save** after customizing

---

## Step 3: Configure Action URL (Optional but Recommended)

### 3.1 Set Custom Action URL
This allows users to be redirected back to your app after verification.

1. Still in the **Templates** tab
2. Click on the **Pencil icon** next to "Customize action URL"
3. Enter your application URL:
   - For development: `http://localhost:3000`
   - For production: `https://your-domain.com`
4. Click **Save**

---

## Step 4: Set Up Email Sender Domain (Production)

### 4.1 Use Custom Domain for Emails (Optional - For Professional Look)
1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **Integrations** tab
3. Find **Email** section
4. Click **Get Started** under "Custom email domain"
5. Follow the instructions to verify your domain via DNS records

*Note: This requires a custom domain and is recommended for production.*

---

## Step 5: Configure Email Verification in Your App

The email verification functionality is already implemented in the WareHouse Hub application with these features:

### Implemented Features:
✅ **Send Verification Email** - Users can request a verification email
✅ **Refresh Verification Status** - Users can check if they've verified their email
✅ **Automatic Status Update** - User profile updates after email verification
✅ **Visual Indicators** - Shows verification status in user profile

### Code Already Added:
- `sendVerificationEmail()` in `src/lib/auth.js`
- `refreshEmailVerification()` in `src/lib/auth.js`
- Email verification UI in both Merchant and Owner dashboards

---

## Step 6: Test Email Verification

### 6.1 Testing Flow
1. **Sign up a new user** in your application
2. Navigate to **Settings** / **Profile** section
3. Check that email shows "✗ Not Verified"
4. Click the **"Send Email"** button
5. Check your email inbox (including spam folder)
6. Click the verification link in the email
7. Return to the app and click **"Refresh"** button
8. Status should update to "✓ Verified"

### 6.2 View Verification Status in Firebase Console
1. Go to **Authentication** > **Users** tab
2. Find your test user
3. The **Email verified** column should show a checkmark ✓

---

## Step 7: Production Best Practices

### 7.1 Email Deliverability
- Set up a custom sender domain (Step 4) for better deliverability
- Add SPF and DKIM records to your domain
- Monitor email delivery in Firebase Console

### 7.2 Security Considerations
- **Require email verification**: Consider restricting certain features until email is verified
- **Resend limits**: The app already handles errors for rate limiting
- **Link expiration**: Firebase verification links expire after a certain time

### 7.3 User Experience
- Send verification email immediately after signup (optional - can be added)
- Show clear instructions about checking spam folder
- Provide easy access to resend verification email
- Auto-refresh verification status when user returns to the app

---

## Step 8: Sending Verification Email on Signup (Optional Enhancement)

If you want to automatically send a verification email when users sign up:

### Update `src/lib/auth.js`:

Add this code in the `registerUser` function after creating the user:

```javascript
// Send email verification immediately after signup
if (!user.emailVerified) {
  await sendEmailVerification(user);
}
```

---

## Troubleshooting

### Email Not Received
1. **Check spam folder** - Firebase emails often end up in spam
2. **Verify email in Firebase Console** - Make sure templates are saved correctly
3. **Check quotas** - Firebase has rate limits on email sending
4. **Test with different email providers** - Try Gmail, Outlook, etc.

### Verification Link Not Working
1. **Check action URL** - Make sure it's configured correctly in Firebase
2. **Link expired** - Request a new verification email
3. **Already verified** - User might have already verified

### "Too Many Requests" Error
- Firebase limits email sending to prevent abuse
- Wait a few minutes before trying again
- Check Firebase Console for rate limit details

---

## Additional Resources

- [Firebase Email Verification Documentation](https://firebase.google.com/docs/auth/web/email-verification)
- [Firebase Email Templates](https://firebase.google.com/docs/auth/custom-email-handler)
- [Firebase Authentication Best Practices](https://firebase.google.com/docs/auth/web/auth-state-persistence)

---

## Summary

Your WareHouse Hub application now has full email verification functionality:

1. ✅ Firebase email verification is configured
2. ✅ Custom email templates are set (or can be customized)
3. ✅ Users can send verification emails from their profile
4. ✅ Users can refresh their verification status
5. ✅ Profile images can be uploaded
6. ✅ Name and company information can be edited (with restrictions)
7. ✅ Visual feedback for all actions

**Note**: Remember that users can only change their name **once**. This is enforced in the code with the `nameChanged` flag in Firestore.
