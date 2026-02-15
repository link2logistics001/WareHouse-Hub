# Firebase Storage Upload Fix

## Issue
Profile image upload gets stuck on "Uploading image..." and never completes.

## Common Causes

### 1. ❌ Storage Rules Not Configured
Firebase Storage has strict security rules by default that block all uploads.

### 2. ❌ Storage Bucket Not Initialized  
The storage bucket might not be properly set up in your Firebase project.

### 3. ❌ CORS Issues
Cross-origin requests might be blocked.

---

## Solutions

### Step 1: Configure Firebase Storage Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `warehousehub-810c3`
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab
5. Replace the rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile images - only allow authenticated users to upload their own images
    match /profile-images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Warehouse images - allow authenticated owners to upload
    match /warehouse-images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. Click **Publish**

### Step 2: Verify Storage is Enabled

1. In Firebase Console, go to **Storage**
2. If you see "Get started", click it to initialize Storage
3. Select your location (choose closest to your users)
4. Click **Done**

### Step 3: Check Storage Bucket URL

Verify your storage bucket URL in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=warehousehub-810c3.firebasestorage.app
```

The format should be: `PROJECT_ID.firebasestorage.app` (new format) or `PROJECT_ID.appspot.com` (old format)

---

## Testing

After applying the fixes, try uploading an image again. Check browser console (F12) for any error messages.
