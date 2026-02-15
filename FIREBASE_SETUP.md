# Firebase Authentication Setup Guide

## 📋 Overview
This guide will help you set up Firebase Authentication for your WarehouseHub application with email/password and Google authentication.

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Add project" or "Create a project"
   - Enter project name: `WarehouseHub` (or your preferred name)
   - (Optional) Enable Google Analytics if you want usage analytics
   - Click "Create project"

### Step 2: Register Your Web App

1. **Add Web App to Firebase Project**
   - In your Firebase project dashboard, click the **Web icon (</>)** to add a web app
   - Register app with a nickname: `WarehouseHub Web`
   - ✅ Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration**
   - Firebase will show you a config object with your app credentials
   - **IMPORTANT:** Keep this page open or copy these values immediately
   - You'll need these for your `.env.local` file

### Step 3: Enable Authentication Methods

1. **Navigate to Authentication**
   - In Firebase Console sidebar, click **"Authentication"**
   - Click **"Get started"** if it's your first time

2. **Enable Email/Password Authentication**
   - Go to the **"Sign-in method"** tab
   - Click on **"Email/Password"**
   - Toggle **Enable** switch
   - Click **"Save"**

3. **Enable Google Sign-In**
   - Still in "Sign-in method" tab
   - Click on **"Google"**
   - Toggle **Enable** switch
   - Enter support email (your email)
   - Click **"Save"**

### Step 4: Set Up Firestore Database

1. **Create Firestore Database**
   - In Firebase Console sidebar, click **"Firestore Database"**
   - Click **"Create database"**
   - Select **"Start in production mode"** (we'll configure rules next)
   - Choose a location closest to your users
   - Click **"Enable"**

2. **Configure Security Rules**
   - Go to the **"Rules"** tab in Firestore
   - Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Add other collection rules as needed
    // For now, deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

   - Click **"Publish"**

### Step 5: Configure Environment Variables

1. **Create `.env.local` file**
   - In your project root, copy `.env.local.example` to `.env.local`
   ```bash
   cp .env.local.example .env.local
   ```

2. **Add Firebase Credentials**
   - Open `.env.local` in your editor
   - Replace placeholder values with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

   - **Where to find these values:**
     - Firebase Console → Project Settings (gear icon) → General tab → Your apps → SDK setup and configuration

3. **Add `.env.local` to `.gitignore`**
   - Ensure `.env.local` is in your `.gitignore` file:
```
.env.local
.env*.local
```

### Step 6: Configure OAuth Consent Screen (For Google Sign-In)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your Firebase project

2. **Configure OAuth Consent Screen**
   - Navigate to **APIs & Services** → **OAuth consent screen**
   - Choose **External** user type
   - Fill in required fields:
     - App name: `WarehouseHub`
     - User support email: your email
     - Developer contact information: your email
   - Click **"Save and Continue"**
   - Skip scopes (default is fine)
   - Add test users if needed
   - Click **"Save and Continue"**

### Step 7: Test Your Setup

1. **Start Development Server**
```bash
D
```

2. **Test Authentication Features**
   - ✅ Sign up with email/password
   - ✅ Sign in with existing account
   - ✅ Sign in with Google
   - ✅ Forgot password (check email)
   - ✅ User data persists in Firestore

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── firebase.js         # Firebase initialization
│   └── auth.js             # Authentication functions
├── contexts/
│   └── AuthContext.js      # Auth state management
└── components/
    └── commonfiles/
        └── Login.js         # Updated login component
```

---

## 🔐 Security Best Practices

### ✅ DO's:
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use environment variables for sensitive data
- ✅ Implement proper Firestore security rules
- ✅ Validate user input on both client and server
- ✅ Use Firebase Admin SDK for sensitive server operations

### ❌ DON'Ts:
- ❌ Never commit `.env.local` to version control
- ❌ Don't expose Firebase credentials in client code (use env vars)
- ❌ Don't allow unrestricted Firestore access
- ❌ Don't store sensitive data in Firestore without encryption

---

## 🎯 Authentication Flow

### Sign Up Flow:
1. User enters email, password, name, and selects user type (merchant/owner)
2. `registerUser()` creates Firebase Auth account
3. User profile is updated with display name
4. Additional user data is stored in Firestore `/users/{uid}` collection
5. User is automatically signed in
6. `onLoginSuccess()` callback is triggered

### Sign In Flow:
1. User enters email and password
2. `loginUser()` authenticates with Firebase
3. User data is fetched from Firestore
4. `onLoginSuccess()` callback is triggered with user data

### Google Sign-In Flow:
1. User clicks "Sign in with Google"
2. Google OAuth popup opens
3. User selects Google account
4. If first time: user document is created in Firestore
5. `onLoginSuccess()` callback is triggered

---

## 🔄 Using Auth in Components

### Access Current User:
```javascript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (!isAuthenticated) return <div>Please sign in</div>
  
  return <div>Welcome, {user.name}!</div>
}
```

### Sign Out:
```javascript
import { logoutUser } from '@/lib/auth'

const handleLogout = async () => {
  try {
    await logoutUser()
    // User will be automatically signed out
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Firebase: Error (auth/configuration-not-found)"
**Solution:** Verify your environment variables are correctly set in `.env.local` and restart the dev server.

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution:** 
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your domain (e.g., `localhost`, `your-domain.com`)

### Issue: Google Sign-In popup blocked
**Solution:** 
- Ensure popup blockers are disabled
- Check browser console for errors
- Verify OAuth consent screen is configured

### Issue: User data not persisting
**Solution:** 
- Check Firestore security rules
- Verify Firestore is enabled in Firebase Console
- Check browser console for Firestore errors

---

## 📊 Firestore Data Structure

```
/users/{userId}
  ├── uid: string
  ├── email: string
  ├── name: string
  ├── company: string
  ├── userType: "merchant" | "owner"
  ├── verified: boolean
  ├── createdAt: timestamp
  └── updatedAt: timestamp
```

---

## 🎨 Features Implemented

- ✅ Email/Password Authentication
- ✅ Google OAuth Sign-In
- ✅ User Registration with User Type (Merchant/Owner)
- ✅ Password Reset via Email
- ✅ Persistent Authentication State
- ✅ User Profile Storage in Firestore
- ✅ Loading States & Error Handling
- ✅ Form Validation
- ✅ Responsive UI with Animations

---

## 📝 Next Steps (Optional Enhancements)

1. **Email Verification**
   - Send verification email after registration
   - Restrict access until email is verified

2. **Profile Update**
   - Allow users to update their profile
   - Change password functionality

3. **Role-Based Access Control**
   - Implement custom claims for user roles
   - Restrict features based on user type

4. **Multi-Factor Authentication**
   - Add phone verification
   - Enable 2FA for enhanced security

5. **Social Login**
   - Add Facebook, Twitter, GitHub authentication
   - Apple Sign-In for iOS users

---

## 💡 Tips

- Test with different email providers (Gmail, Outlook, etc.)
- Use Firebase Emulator Suite for local testing
- Monitor Firebase Console for authentication errors
- Set up email templates in Firebase Console → Authentication → Templates
- Enable password policy in Firebase Console for stronger passwords

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console logs
2. Review browser console errors
3. Verify all environment variables are set
4. Ensure Firebase services are enabled
5. Check Firestore security rules

---

## ✅ Setup Checklist

- [ ] Created Firebase project
- [ ] Registered web app
- [ ] Enabled Email/Password authentication
- [ ] Enabled Google authentication
- [ ] Created Firestore database
- [ ] Configured Firestore security rules
- [ ] Added environment variables to `.env.local`
- [ ] Configured OAuth consent screen
- [ ] Tested sign up with email
- [ ] Tested sign in with email
- [ ] Tested Google sign-in
- [ ] Verified user data in Firestore

---

**🎉 Congratulations! Your Firebase authentication is now set up and ready to use!**
