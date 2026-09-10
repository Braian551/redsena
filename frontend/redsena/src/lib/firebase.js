import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
const isFirebaseConfigured = requiredConfigKeys.every((key) => Boolean(firebaseConfig[key]))
const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null
const auth = app ? getAuth(app) : null
const storage = app && firebaseConfig.storageBucket ? getStorage(app) : null
const analytics = (() => {
  if (!app || !firebaseConfig.measurementId || typeof window === 'undefined') {
    return null
  }

  try {
    return getAnalytics(app)
  } catch {
    return null
  }
})()
const provider = app ? new GoogleAuthProvider() : null

if (provider) {
  provider.setCustomParameters({
    prompt: 'select_account',
  })
}

export { analytics, app, auth, isFirebaseConfigured, provider, storage }
