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
  signInWithPopup,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { saveContactDetails } from './contactDetails';

const USER_ROLES = ['owner', 'merchant', 'admin', 'dataentry'];

export const getUserDocParams = async (uid) => {
  // Check the new structure first
  const docs = await Promise.all(USER_ROLES.map(role => 
    getDoc(doc(db, 'users', role, 'accounts', uid))
  ));
  const found = docs.find(d => d.exists());
  
  if (found) {
    return { ref: found.ref, data: found.data() };
  }

  // Fallback to the old structure
  const oldDocRef = doc(db, 'users', uid);
  const oldDoc = await getDoc(oldDocRef);
  if (oldDoc.exists()) {
    const data = oldDoc.data();
    const role = data.userType || 'merchant'; // safe fallback
    
    // Auto-migrate the user to the new structure
    const newRef = doc(db, 'users', role, 'accounts', uid);
    await setDoc(newRef, data);
    return { ref: newRef, data };
  }

  return null;
};

// ─── Client-side auth rate limiting ─────────────────────────────────────────
// Client-side backoff helper to discourage rapid retries in the UI.
// NOTE: This runs only in memory on the client and can be bypassed.
//       It does NOT provide real brute-force protection; enforce limits on the server.
const AUTH_RATE_LIMIT_WINDOW = 60_000; // 1 minute
const AUTH_RATE_LIMIT_MAX = 5;      // max attempts per window
const RESET_RATE_LIMIT_MAX = 3;      // max password resets per window

const authAttempts = [];               // timestamps of auth attempts
const resetAttempts = [];              // timestamps of password reset attempts

function checkAuthRateLimit(attempts, maxAttempts) {
  const now = Date.now();
  // Remove expired timestamps
  while (attempts.length > 0 && now - attempts[0] > AUTH_RATE_LIMIT_WINDOW) {
    attempts.shift();
  }
  if (attempts.length >= maxAttempts) {
    const waitSeconds = Math.ceil((AUTH_RATE_LIMIT_WINDOW - (now - attempts[0])) / 1000);
    throw new Error(
      `Too many attempts. Please wait ${waitSeconds} second${waitSeconds !== 1 ? 's' : ''} before trying again.`
    );
  }
  attempts.push(now);
}

/**
 * Flag set to true while loginUser / loginWithGoogle is executing.
 * AuthContext checks this to avoid reacting to intermediate auth-state
 * events (sign-in → mismatch detected → sign-out) that happen inside
 * the login flow, which would otherwise cause the wrong dashboard to render.
 */
export let loginFlowActive = false;

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
const validatePassword = (password) => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  if (password.length < 8) {
    return { isValid: true, message: 'Password is weak. Consider using 8+ characters with numbers and symbols' };
  }

  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);

  if (hasNumber && hasSpecial && hasUpper && hasLower) {
    return { isValid: true, message: 'Strong password' };
  } else if ((hasNumber || hasSpecial) && (hasUpper || hasLower)) {
    return { isValid: true, message: 'Moderate password strength' };
  }

  return { isValid: true, message: 'Password is weak. Consider adding numbers, symbols, and mixed case' };
};

/**
 * Check if email is already registered
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists
 */
export const checkEmailExists = async (email) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {

    return false;
  }
};

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
  // Rate-limit registration attempts
  checkAuthRateLimit(authAttempts, AUTH_RATE_LIMIT_MAX);

  try {
    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }

    // Check if email already exists and validate userType
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      // Check if user document exists in Firestore to get userType
      // We use collectionGroup 'accounts' since profiles are now subcollections
      const q = query(collectionGroup(db, 'accounts'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingUserData = querySnapshot.docs[0].data();
        const existingUserType = existingUserData.userType;

        if (existingUserType !== userType) {
          throw new Error(`This email is already registered as ${existingUserType}. Please sign in as ${existingUserType} or use a different email.`);
        }
      }

      throw new Error('This email is already registered. Please sign in instead.');
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send branded verification email via our custom API
    try {
      await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
    } catch (apiError) {
      console.error('Failed to send custom verification email, falling back to default:', apiError);
      // Fallback to default if custom API fails
      await sendEmailVerification(user);
    }

    // Update user profile with display name
    await updateProfile(user, {
      displayName: name
    });

    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', userType, 'accounts', user.uid), {
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

    // Also save to contact_details/{userType}/users/{uid}
    await saveContactDetails(userType, user.uid, {
      name,
      email: user.email,
      company,
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
      nameChanged: false,
      verificationSent: true
    };
  } catch (error) {

    throw handleAuthError(error);
  }
};

/**
 * Sign in user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} userType - Selected account type ('merchant' or 'owner')
 * @returns {Promise<Object>} User data with userType
 */
export const loginUser = async (email, password, userType) => {
  // Rate-limit login attempts
  checkAuthRateLimit(authAttempts, AUTH_RATE_LIMIT_MAX);

  loginFlowActive = true;
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Validate password is not empty
    if (!password || password.trim().length === 0) {
      throw new Error('Please enter your password');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch additional user data from Firestore using the new helper
    const userResult = await getUserDocParams(user.uid);

    if (userResult) {
      const userData = userResult.data;

      // ── Admin & Data Entry override: can log in from any portal ────
      // If this email is an admin or data entry, redirect them to their panel
      // regardless of which role (merchant/owner) they selected.
      if (userData.userType === 'admin' || userData.userType === 'dataentry') {
        return {
          uid: user.uid,
          email: user.email,
          name: userData.name || user.displayName || '',
          company: userData.company || '',
          userType: userData.userType,
          verified: userData.verified || (userData.userType === 'admin' ? true : false),
          emailVerified: userData.emailVerified || user.emailVerified || false,
          photoURL: userData.photoURL || user.photoURL || null,
          nameChanged: userData.nameChanged || false
        };
      }

      // Validate userType matches selected type — sign out first so Firebase
      // auth state is clean before we throw, preventing AuthContext from
      // seeing a briefly-signed-in user of the wrong type.
      if (userData.userType !== userType) {
        await signOut(auth);
        const err = new Error('User already registered.');
        err.code = 'auth/wrong-user-type';
        throw err;
      }

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
      // Firebase auth succeeded but no Firestore doc — treat as unregistered
      await signOut(auth);
      if (typeof window !== 'undefined') sessionStorage.setItem('signUpPromptNeeded', 'true');
      const err = new Error('No account found. Please sign up first.');
      err.code = 'auth/user-not-registered';
      throw err;
    }
  } catch (error) {
    if (!error.code || !['auth/user-not-registered', 'auth/wrong-user-type'].includes(error.code)) {

    }
    throw handleAuthError(error);
  } finally {
    loginFlowActive = false;
  }
};

/**
 * Sign in with Google
 * @param {string} userType - 'merchant' or 'owner'
 * @returns {Promise<Object>} User data
 */
export const loginWithGoogle = async (userType, isSignIn = false) => {
  // Rate-limit Google sign-in attempts
  checkAuthRateLimit(authAttempts, AUTH_RATE_LIMIT_MAX);

  loginFlowActive = true;
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user document exists in Firestore using new helper
    const userResult = await getUserDocParams(user.uid);

    if (!userResult) {
      if (isSignIn) {
        // User tried to SIGN IN but has no account — reject and prompt sign up
        await signOut(auth);
        if (typeof window !== 'undefined') sessionStorage.setItem('signUpPromptNeeded', 'true');
        const err = new Error('No account found with this Google account. Please sign up first.');
        err.code = 'auth/user-not-registered';
        throw err;
      }

      // Sign-UP flow: create user document with selected userType
      await setDoc(doc(db, 'users', userType, 'accounts', user.uid), {
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

      // Also save to contact_details/{userType}/users/{uid}
      await saveContactDetails(userType, user.uid, {
        name: user.displayName || '',
        email: user.email,
        company: '',
      });

      return {
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
    }

    // User exists — check for admin override first
    const existingUserData = userResult.data;

    // ── Admin & Data Entry override: can log in from any portal ────
    if (existingUserData.userType === 'admin' || existingUserData.userType === 'dataentry') {
      return {
        uid: user.uid,
        email: user.email,
        name: existingUserData.name || user.displayName || '',
        company: existingUserData.company || '',
        userType: existingUserData.userType,
        verified: existingUserData.verified || (existingUserData.userType === 'admin' ? true : false),
        emailVerified: existingUserData.emailVerified || user.emailVerified || false,
        photoURL: existingUserData.photoURL || user.photoURL || null,
        nameChanged: existingUserData.nameChanged || false
      };
    }

    // Validate userType matches selected type
    if (existingUserData.userType !== userType) {
      await signOut(auth);
      const err = new Error('User already registered.');
      err.code = 'auth/wrong-user-type';
      throw err;
    }

    return {
      uid: user.uid,
      email: user.email,
      name: existingUserData.name,
      company: existingUserData.company || '',
      userType: existingUserData.userType,
      verified: existingUserData.verified,
      emailVerified: existingUserData.emailVerified || user.emailVerified || false,
      photoURL: existingUserData.photoURL || user.photoURL || null,
      nameChanged: existingUserData.nameChanged || false
    };
  } catch (error) {
    if (!error.code || !['auth/user-not-registered', 'auth/popup-closed-by-user', 'auth/wrong-user-type'].includes(error.code)) {

    }
    throw handleAuthError(error);
  } finally {
    loginFlowActive = false;
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

    throw handleAuthError(error);
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  // Rate-limit password reset requests (stricter limit)
  checkAuthRateLimit(resetAttempts, RESET_RATE_LIMIT_MAX);

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {

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
    const userResult = await getUserDocParams(uid);
    if (userResult) {
      return userResult.data;
    }
    return null;
  } catch (error) {

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
    const userResult = await getUserDocParams(uid);
    if (!userResult) {
      throw new Error('User not found');
    }

    const userData = userResult.data;

    // Check if name has been changed before (only allow one name change)
    if (updates.name && updates.name !== userData.name) {
      if (userData.nameChanged) {
        throw new Error('Name can only be changed once. You have already changed your name previously.');
      }
      updates.nameChanged = true;
    }

    // Update Firestore document
    await updateDoc(userResult.ref, {
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
    const updatedDoc = await getDoc(userResult.ref);
    const finalData = updatedDoc.data();

    // Sync relevant fields to contact_details collection
    if (finalData.userType) {
      const contactSync = {};
      if (updates.name) contactSync.name = updates.name;
      if (updates.company !== undefined) contactSync.company = updates.company;
      if (Object.keys(contactSync).length > 0) {
        try {
          const { updateContactDetails } = await import('./contactDetails');
          await updateContactDetails(finalData.userType, uid, contactSync);
        } catch {
          // contact_details doc may not exist yet — ignore gracefully
        }
      }
    }

    return finalData;
  } catch (error) {

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
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file (JPG, PNG, etc.)');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    // Build a clean filename from the user's display name
    const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
    const displayName = auth.currentUser?.displayName || 'user';
    const safeName = displayName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${safeName}.${ext}`;
    const storagePath = `profile-images/${uid}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: uid,
        uploadedAt: new Date().toISOString()
      }
    };

    await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(storageRef);

    const userResult = await getUserDocParams(uid);
    if (userResult) {
      await updateDoc(userResult.ref, {
        photoURL: downloadURL,
        updatedAt: serverTimestamp()
      });
    }

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });
    }

    return downloadURL;
  } catch (error) {
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
  } catch (error) {
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
      const userResult = await getUserDocParams(user.uid);
      if (userResult) {
        await updateDoc(userResult.ref, {
          emailVerified: true,
          updatedAt: serverTimestamp()
        });
      }
    }

    return user.emailVerified;
  } catch (error) {

    throw error;
  }
};

/**
 * Handle Firebase authentication errors
 * @param {Object} error - Firebase error object
 * @returns {Error} Formatted error with user-friendly message
 */
const handleAuthError = (error) => {
  // If it's already a custom error message, return it as is
  if (!error.code || error.code === undefined) {
    return error;
  }

  let message = 'An error occurred. Please try again.';

  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'This email is already registered. Please sign in instead or use the "Forgot password" option.';
      break;
    case 'auth/invalid-email':
      message = 'Please enter a valid email address (e.g., user@example.com).';
      break;
    case 'auth/operation-not-allowed':
      message = 'This sign-in method is not enabled. Please contact support.';
      break;
    case 'auth/weak-password':
      message = 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
      break;
    case 'auth/user-disabled':
      message = 'This account has been disabled. Please contact support for assistance.';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email. Please sign up first.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password. Please try again or use "Forgot password" to reset it.';
      break;
    case 'auth/invalid-credential':
      message = 'No account found with these credentials. Please sign up first.';
      break;
    case 'auth/user-not-registered':
      // Custom code — thrown when sign-in attempted for non-existent account
      return error; // already has the right message, pass through
    case 'auth/wrong-user-type':
      // Custom code — thrown when email exists under a different role
      return error; // already has the right message, pass through
    case 'auth/too-many-requests':
      message = 'Too many failed login attempts. Please wait a few minutes before trying again.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your internet connection and try again.';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Sign-in window was closed. Please try again.';
      break;
    case 'auth/account-exists-with-different-credential':
      message = 'An account already exists with this email using a different sign-in method.';
      break;
    case 'auth/invalid-verification-code':
      message = 'Invalid verification code. Please try again.';
      break;
    case 'auth/invalid-verification-id':
      message = 'Verification session expired. Please request a new code.';
      break;
    default:
      message = error.message || 'An unexpected error occurred. Please try again.';
  }

  const err = new Error(message);
  err.code = error.code;
  return err;
};
