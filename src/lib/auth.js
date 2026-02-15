/**
 * Authentication Service
 * 
 * This file contains all authentication-related functions
 * for user registration, login, logout, and password reset.
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';

/**
 * Register a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} name - User's full name
 * @param {string} userType - 'merchant' or 'owner'
 * @param {string} company - Company name (optional)
 * @returns {Promise<Object>} User data with userType
 */
export const registerUser = async (email, password, name, userType, company = '') => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: name
    });

    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name: name,
      company: company,
      userType: userType,
      verified: false,
      emailVerified: false,
      nameChanged: false,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      uid: user.uid,
      email: user.email,
      name: name,
      company: company,
      userType: userType,
      verified: false,
      emailVerified: false,
      photoURL: null,
      nameChanged: false
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw handleAuthError(error);
  }
};

/**
 * Sign in user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} User data with userType
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        name: userData.name || user.displayName,
        company: userData.company || '',
        userType: userData.userType,
        verified: userData.verified || false,
        emailVerified: userData.emailVerified || user.emailVerified || false,
        photoURL: userData.photoURL || user.photoURL || null,
        nameChanged: userData.nameChanged || false
      };
    } else {
      throw new Error('User data not found');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    throw handleAuthError(error);
  }
};

/**
 * Sign in with Google
 * @param {string} userType - 'merchant' or 'owner'
 * @returns {Promise<Object>} User data
 */
export const loginWithGoogle = async (userType) => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // First time Google sign-in, create user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        company: '',
        userType: userType,
        verified: user.emailVerified,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || null,
        nameChanged: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    const userData = userDoc.exists() ? userDoc.data() : {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      company: '',
      userType: userType,
      verified: user.emailVerified,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || null,
      nameChanged: false
    };

    return {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      company: userData.company || '',
      userType: userData.userType,
      verified: userData.verified,
      emailVerified: userData.emailVerified || user.emailVerified || false,
      photoURL: userData.photoURL || user.photoURL || null,
      nameChanged: userData.nameChanged || false
    };
  } catch (error) {
    console.error('Error with Google sign-in:', error);
    throw handleAuthError(error);
  }
};

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw handleAuthError(error);
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw handleAuthError(error);
  }
};

/**
 * Get current user data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User data or null
 */
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

/**
 * Update user profile information
 * @param {string} uid - User ID
 * @param {Object} updates - Object containing fields to update (name, company)
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    
    // Check if name has been changed before (only allow one name change)
    if (updates.name && updates.name !== userData.name) {
      if (userData.nameChanged) {
        throw new Error('Name can only be changed once. You have already changed your name previously.');
      }
      updates.nameChanged = true;
    }

    // Update Firestore document
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // If name is being updated, also update Firebase Auth profile
    if (updates.name && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: updates.name
      });
    }

    // Return updated user data
    const updatedDoc = await getDoc(doc(db, 'users', uid));
    return updatedDoc.data();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload user profile image
 * @param {string} uid - User ID
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadProfileImage = async (uid, file) => {
  try {
    console.log('📤 Starting image upload for user:', uid);
    console.log('📁 File details:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file (JPG, PNG, etc.)');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    // Create a reference to the storage location
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `profile-images/${uid}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    console.log('📍 Storage path:', storagePath);

    // Upload the file with metadata
    console.log('⬆️ Uploading to Firebase Storage...');
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: uid,
        uploadedAt: new Date().toISOString()
      }
    };
    
    const uploadResult = await uploadBytes(storageRef, file, metadata);
    console.log('✅ Upload complete:', uploadResult.metadata.fullPath);

    // Get the download URL
    console.log('🔗 Getting download URL...');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Download URL obtained:', downloadURL);

    // Update user document with photo URL
    console.log('💾 Updating Firestore...');
    await updateDoc(doc(db, 'users', uid), {
      photoURL: downloadURL,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Firestore updated');

    // Update Firebase Auth profile
    if (auth.currentUser) {
      console.log('👤 Updating Auth profile...');
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });
      console.log('✅ Auth profile updated');
    }

    console.log('🎉 Image upload completed successfully!');
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading profile image:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide more helpful error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was cancelled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Upload failed. Please check your internet connection and try again.');
    } else if (error.code === 'storage/object-not-found') {
      throw new Error('Storage bucket not found. Please check Firebase configuration.');
    } else if (error.code === 'storage/bucket-not-found') {
      throw new Error('Storage bucket not configured. Please set up Storage in Firebase Console.');
    } else {
      throw error;
    }
  }
};

/**
 * Send email verification to current user
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Add action code settings to improve email delivery
    const actionCodeSettings = {
      url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      handleCodeInApp: false,
    };

    await sendEmailVerification(user, actionCodeSettings);
    
    // Log success for debugging
    console.log('✅ Verification email sent to:', user.email);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw handleAuthError(error);
  }
};

/**
 * Refresh user email verification status
 * @returns {Promise<boolean>} Email verification status
 */
export const refreshEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Reload user data from Firebase
    await user.reload();
    
    // Update Firestore if email is now verified
    if (user.emailVerified) {
      await updateDoc(doc(db, 'users', user.uid), {
        emailVerified: true,
        updatedAt: serverTimestamp()
      });
    }

    return user.emailVerified;
  } catch (error) {
    console.error('Error refreshing email verification:', error);
    throw error;
  }
};

/**
 * Handle Firebase authentication errors
 * @param {Object} error - Firebase error object
 * @returns {Error} Formatted error with user-friendly message
 */
const handleAuthError = (error) => {
  let message = 'An error occurred. Please try again.';
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'This email is already registered. Please sign in instead.';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email address format.';
      break;
    case 'auth/operation-not-allowed':
      message = 'Operation not allowed. Please contact support.';
      break;
    case 'auth/weak-password':
      message = 'Password is too weak. Use at least 6 characters.';
      break;
    case 'auth/user-disabled':
      message = 'This account has been disabled.';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password. Please try again.';
      break;
    case 'auth/invalid-credential':
      message = 'Invalid email or password. Please try again.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed attempts. Please try again later.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your connection.';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Sign-in cancelled. Please try again.';
      break;
    default:
      message = error.message || 'An unexpected error occurred.';
  }
  
  const err = new Error(message);
  err.code = error.code;
  return err;
};
