# Firebase Auth Quick Reference

## 🔥 Importing Auth Functions

```javascript
import { registerUser, loginUser, loginWithGoogle, logoutUser, resetPassword } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
```

---

## 👤 User Registration

```javascript
const handleSignUp = async (email, password, name, userType, company) => {
  try {
    const user = await registerUser(email, password, name, userType, company)
    console.log('User registered:', user)
    // user contains: { uid, email, name, company, userType, verified }
  } catch (error) {
    console.error('Registration error:', error.message)
  }
}
```

---

## 🔐 User Login

```javascript
const handleLogin = async (email, password) => {
  try {
    const user = await loginUser(email, password)
    console.log('User logged in:', user)
  } catch (error) {
    console.error('Login error:', error.message)
  }
}
```

---

## 🔵 Google Sign-In

```javascript
const handleGoogleSignIn = async (userType) => {
  try {
    const user = await loginWithGoogle(userType) // 'merchant' or 'owner'
    console.log('Google sign-in successful:', user)
  } catch (error) {
    console.error('Google sign-in error:', error.message)
  }
}
```

---

## 🚪 Logout

```javascript
import { logoutUser } from '@/lib/auth'

const handleLogout = async () => {
  try {
    await logoutUser()
    console.log('User logged out')
  } catch (error) {
    console.error('Logout error:', error.message)
  }
}
```

---

## 🔑 Password Reset

```javascript
const handlePasswordReset = async (email) => {
  try {
    await resetPassword(email)
    console.log('Password reset email sent')
  } catch (error) {
    console.error('Password reset error:', error.message)
  }
}
```

---

## 📱 Using Auth Context

```javascript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, loading, error, isAuthenticated } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <p>Type: {user.userType}</p>
      <p>Company: {user.company}</p>
    </div>
  )
}
```

---

## 🎯 Auth State Properties

```javascript
const { 
  user,              // Current user object or null
  loading,           // Boolean - true while checking auth state
  error,             // Error message if any
  isAuthenticated,   // Boolean - true if user is logged in
  setUser,           // Function to manually set user (rarely needed)
  setError           // Function to set error message
} = useAuth()
```

---

## 👨‍💼 User Object Structure

```javascript
user = {
  uid: "firebase-uid-string",
  email: "user@example.com",
  name: "John Doe",
  company: "ABC Corp",
  userType: "merchant", // or "owner"
  verified: false,
  emailVerified: false
}
```

---

## ⚠️ Error Handling

Common error codes and messages:

```javascript
// Email already in use
auth/email-already-in-use

// Invalid email format
auth/invalid-email

// Password too weak (less than 6 characters)
auth/weak-password

// User not found
auth/user-not-found

// Wrong password
auth/wrong-password

// Invalid credentials
auth/invalid-credential

// Too many failed attempts
auth/too-many-requests

// Network error
auth/network-request-failed

// Popup closed by user (Google Sign-In)
auth/popup-closed-by-user
```

---

## 🔒 Protected Routes Example

```javascript
'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <div>Protected Content</div>
}
```

---

## 🎨 Conditional Rendering

```javascript
function Header() {
  const { isAuthenticated, user } = useAuth()

  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <button onClick={() => router.push('/login')}>Login</button>
          <button onClick={() => router.push('/signup')}>Sign Up</button>
        </>
      )}
    </header>
  )
}
```

---

## 📊 Accessing Firestore User Data

```javascript
import { getUserData } from '@/lib/auth'

const fetchUserData = async (uid) => {
  try {
    const userData = await getUserData(uid)
    console.log('User data from Firestore:', userData)
  } catch (error) {
    console.error('Error fetching user data:', error)
  }
}
```

---

## 🔄 Updating User Profile (Custom Implementation)

Add this to `src/lib/auth.js`:

```javascript
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'

export const updateUserProfile = async (updates) => {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')

    // Update Firebase Auth profile
    if (updates.name) {
      await updateProfile(user, { displayName: updates.name })
    }

    // Update Firestore document
    await updateDoc(doc(db, 'users', user.uid), {
      ...updates,
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('Error updating profile:', error)
    throw handleAuthError(error)
  }
}
```

---

## 🧪 Testing Auth Locally

```javascript
// Test credentials for development
const testAccounts = {
  merchant: {
    email: 'merchant@test.com',
    password: 'test123456',
    userType: 'merchant'
  },
  owner: {
    email: 'owner@test.com',
    password: 'test123456',
    userType: 'owner'
  }
}
```

---

## 🎬 Complete Login Component Example

```javascript
'use client'
import { useState } from 'react'
import { loginUser, loginWithGoogle } from '@/lib/auth'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await loginUser(email, password)
      console.log('Logged in:', user)
      // Redirect or update UI
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      const user = await loginWithGoogle('merchant')
      console.log('Google sign-in successful:', user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <button type="button" onClick={handleGoogleSignIn} disabled={loading}>
        Sign in with Google
      </button>
    </form>
  )
}
```

---

## 📝 Best Practices

1. **Always handle errors gracefully**
   - Display user-friendly error messages
   - Log detailed errors for debugging

2. **Show loading states**
   - Disable buttons during async operations
   - Show spinners or loading indicators

3. **Validate input**
   - Check email format
   - Ensure password meets requirements
   - Validate required fields

4. **Secure your Firestore**
   - Implement proper security rules
   - Validate data on the server side

5. **Use environment variables**
   - Never hardcode Firebase credentials
   - Use `.env.local` for sensitive data

---

## 🎯 Common Patterns

### Auto-redirect after login
```javascript
const handleLogin = async (email, password) => {
  try {
    const user = await loginUser(email, password)
    router.push(user.userType === 'merchant' ? '/merchant/dashboard' : '/owner/dashboard')
  } catch (error) {
    setError(error.message)
  }
}
```

### Persistent login check
```javascript
useEffect(() => {
  const checkAuth = () => {
    const { user, loading } = useAuth()
    if (!loading && user) {
      // User is logged in, proceed
    } else if (!loading && !user) {
      // User is not logged in, redirect to login
      router.push('/login')
    }
  }
  checkAuth()
}, [])
```

### Role-based rendering
```javascript
const { user } = useAuth()

if (user?.userType === 'merchant') {
  return <MerchantDashboard />
} else if (user?.userType === 'owner') {
  return <OwnerDashboard />
}
```

---

**📚 For full setup instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**
