/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Wraps the app to make auth state available to all components.
 */

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserData } from '@/lib/auth';

const AuthContext = createContext({});

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * Manages auth state and provides it to children
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in, fetch additional data from Firestore
          const userData = await getUserData(firebaseUser.uid);
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData?.name || firebaseUser.displayName || '',
            company: userData?.company || '',
            userType: userData?.userType || 'merchant',
            verified: userData?.verified || false,
            emailVerified: firebaseUser.emailVerified
          });
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    error,
    setUser,
    setError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
