/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Wraps the app to make auth state available to all components.
 */

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, persistenceReady } from '@/lib/firebase';
import { getUserData, loginFlowActive } from '@/lib/auth';
import { phoneVerificationFlowActive } from '@/lib/phoneAuth';

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
    let unsubscribe = () => { };

    // Wait for persistence to be set BEFORE subscribing to auth state.
    // Without this, onAuthStateChanged can fire before the session token
    // is loaded from sessionStorage, causing an intermittent false-negative
    // (user appears signed out → hero/landing page is shown).
    persistenceReady.then(() => {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        // If loginUser / loginWithGoogle is actively running, ignore all intermediate
        // auth-state events — the Login component will call onLoginSuccess directly.
        if (loginFlowActive || phoneVerificationFlowActive) return;
        if (firebaseUser) {
          let pendingRetry = false;
          try {
            // User is signed in, fetch additional data from Firestore
            const userData = await getUserData(firebaseUser.uid);

            // If Firestore doc doesn't exist yet (race condition on first sign-up),
            // don't set the user — retry after a short delay so loading stays true.
            // We must NEVER fall back to 'business_client' as the default userType, because a new
            // warehouse_partner would end up in the business_client portal on their very first login.
            if (!userData || !userData.userType) {
              pendingRetry = true;
              // Keep loading=true and retry once to handle Firestore propagation lag
              setTimeout(async () => {
                try {
                  const retryData = await getUserData(firebaseUser.uid);
                  if (retryData && retryData.userType) {
                    setUser({
                      uid: firebaseUser.uid,
                      email: firebaseUser.email,
                      name: retryData.name || firebaseUser.displayName || '',
                      company: retryData.company || '',
                      userType: retryData.userType,
                      verified: retryData.verified || false,
                      emailVerified: firebaseUser.emailVerified,
                      phone: retryData.phone || retryData.mobile || ''
                    });
                  }
                } catch {
                  // Firestore doc not ready yet — onLoginSuccess already set the user directly,
                  // so this is safe to ignore silently.
                } finally {
                  setLoading(false);
                }
              }, 800);
            } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name || firebaseUser.displayName || '',
              company: userData.company || '',
              userType: userData.userType,
              verified: userData.verified || false,
              emailVerified: firebaseUser.emailVerified,
              phone: userData.phone || userData.mobile || '',
              isBlocked: userData.isBlocked || false
            });
            }
          } catch (err) {

            setError(err.message);
            pendingRetry = false;
          } finally {
            // Only clear loading if we're NOT waiting for a retry
            if (!pendingRetry) setLoading(false);
          }
        } else {
          // User is signed out
          setUser(null);
          setLoading(false);
        }
      });
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
