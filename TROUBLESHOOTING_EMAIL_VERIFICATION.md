# Troubleshooting Email Verification Issues

## Common Causes and Solutions

### 1. ✅ Email/Password Provider Not Enabled
**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `warehousehub-810c3`
3. Navigate to **Authentication** → **Sign-in method**
4. Ensure **Email/Password** is **ENABLED**
5. Click **Save**

### 2. 📧 Emails Going to Spam Folder
**Solution:**
- Check your **Spam/Junk** folder
- Mark Firebase emails as "Not Spam"
- Add `noreply@warehousehub-810c3.firebaseapp.com` to your contacts

### 3. 🔗 Action URL Not Configured
**Solution:**
1. Go to Firebase Console → **Authentication** → **Templates**
2. Click on **Email address verification**
3. Scroll down to "Customize action URL"
4. Set it to:
   - Development: `http://localhost:3000`
   - Production: Your production URL
5. Click **Save**

### 4. 🚫 Firebase Email Restrictions
**Solution:**
- Firebase has rate limits on emails (100 emails/day on free tier)
- If you hit the limit, wait 24 hours or upgrade to Blaze plan
- Check Firebase Console → **Authentication** → **Templates** for any error messages

### 5. ⏱️ Email Delivery Delay
**Solution:**
- Firebase emails can take 5-15 minutes to arrive
- Try waiting a bit longer
- Check if emails arrive later

### 6. 🔒 Account Email Verification Already Verified
**Solution:**
- If the email is already verified, no email will be sent
- Check in Firebase Console → **Authentication** → **Users**
- Look for the checkmark in the "Identifier" column

### 7. 🌐 Domain/DNS Issues (Production Only)
**Solution:**
- If using custom domain, verify DNS records are correct
- Use Firebase default domain for testing first

---

## Testing Steps

### Step 1: Check Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/u/0/project/warehousehub-810c3/authentication/emails)
2. Go to **Authentication** → **Templates** → **Email address verification**
3. Click "Send test email" to verify email delivery works

### Step 2: Check Browser Console
1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Click "Send Verification Email"
5. Look for any error messages

### Step 3: Use Test Email Address
- Try with a Gmail, Outlook, or Yahoo email
- Some email providers block automated emails
- Corporate/university emails often have strict filters

### Step 4: Check Network Tab
1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Click "Send Verification Email"
4. Look for any failed requests (red status codes)

---

## Manual Testing in Code

Add this temporary code to check if emails are being sent:

```javascript
// In your component where you call sendVerificationEmail
try {
  await sendVerificationEmail();
  console.log('✅ Verification email sent successfully');
  console.log('User:', auth.currentUser?.email);
  console.log('Email verified:', auth.currentUser?.emailVerified);
} catch (error) {
  console.error('❌ Error details:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
}
```

---

## Alternative Solution: Add Action URL to sendEmailVerification

If emails still don't arrive, modify the `sendVerificationEmail` function to include an action URL:

### In `src/lib/auth.js`, update the function:

```javascript
export const sendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Add action code settings
    const actionCodeSettings = {
      url: 'http://localhost:3000', // Change to your production URL when deploying
      handleCodeInApp: false,
    };

    await sendEmailVerification(user, actionCodeSettings);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw handleAuthError(error);
  }
};
```

---

## Still Not Working?

### Check Firebase Quotas
1. Go to Firebase Console → **Authentication** → **Usage**
2. Check if you've hit any limits

### Enable Debug Logging
Add this to your `firebase.js`:

```javascript
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// ... existing code ...

export const auth = getAuth(app);

// Enable debug logging (remove in production)
if (typeof window !== 'undefined') {
  window.auth = auth; // Access auth in console
  console.log('Firebase Auth initialized:', auth);
}
```

### Contact Support
If all else fails:
1. Go to Firebase Console → **Support**
2. Submit a support ticket with your project ID: `warehousehub-810c3`
3. Include details about the issue

---

## Best Practices

1. **Always check spam folder first** - This is the #1 cause
2. **Test with multiple email providers**
3. **Configure action URL in Firebase Console**
4. **Add error logging** to see exact error messages
5. **Check Firebase quotas** if on free plan
6. **Wait 10-15 minutes** before retrying

---

## Production Checklist

Before deploying:
- [ ] Email/Password authentication enabled
- [ ] Email templates customized
- [ ] Action URL set to production domain
- [ ] Custom domain configured (optional)
- [ ] Upgraded to Blaze plan for higher limits (if needed)
- [ ] Tested email verification flow end-to-end
