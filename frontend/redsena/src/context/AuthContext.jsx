import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { AuthContext } from './auth-context.js'
import { auth, isFirebaseConfigured, provider } from '../lib/firebase.js'
import { deleteProfilePhoto, uploadProfilePhoto } from '../lib/profilePhotoStorage.js'

const getAuthErrorMessage = (error) => {
  switch (error?.code) {
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de inicio de sesión. Permite las ventanas emergentes e inténtalo de nuevo.'
    case 'auth/popup-closed-by-user':
      return 'La ventana de inicio de sesión se cerró antes de completar la autenticación.'
    case 'auth/cancelled-popup-request':
      return 'Ya existe otra solicitud de inicio de sesión en curso.'
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este correo usando otro método de inicio de sesión.'
    case 'auth/operation-not-allowed':
      return 'El inicio de sesión con Google no está habilitado en Firebase.'
    case 'auth/unauthorized-domain':
      return 'Este dominio no está autorizado para iniciar sesión con Firebase.'
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Firebase. Comprueba tu conexión e inténtalo de nuevo.'
    case 'auth/api-key-not-valid':
      return 'La API key de Firebase no es válida para este proyecto. Revisa la configuración de VITE_FIREBASE_API_KEY y reinicia Vite.'
    case 'auth/too-many-requests':
      return 'Se realizaron demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'El correo o la contraseña no son correctos.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo. Inicia sesión o usa otro correo.'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/invalid-email':
      return 'Escribe un correo electrónico válido.'
    case 'app/firebase-not-configured':
      return 'Falta configurar Firebase. Copia .env.example a .env.local y completa sus valores.'
    case 'app/firebase-storage-not-configured':
      return 'Falta configurar Firebase Storage. Completa VITE_FIREBASE_STORAGE_BUCKET para guardar tu foto.'
    case 'profile-photo/invalid-type':
    case 'profile-photo/file-too-large':
      return error.message
    case 'storage/unauthorized':
      return 'Firebase no permite guardar esta foto. Revisa las reglas de Storage.'
    default:
      return 'No se pudo completar la operación de autenticación. Inténtalo de nuevo.'
  }
}

const getGooglePhotoURL = (currentUser) => currentUser?.providerData
  ?.find((providerData) => providerData.providerId === 'google.com')
  ?.photoURL || ''

const toSessionUser = (currentUser) => {
  if (!currentUser) {
    return null
  }

  const googlePhotoURL = getGooglePhotoURL(currentUser)

  return {
    ...currentUser,
    googlePhotoURL,
    photoURL: currentUser.photoURL || googlePhotoURL || null,
    getIdToken: () => currentUser.getIdToken(),
  }
}

const getConfiguredAuth = () => {
  if (!isFirebaseConfigured || !auth) {
    const configurationError = new Error('Firebase no está configurado.')
    configurationError.code = 'app/firebase-not-configured'
    throw configurationError
  }

  return auth
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [error, setError] = useState(
    isFirebaseConfigured ? null : getAuthErrorMessage({ code: 'app/firebase-not-configured' }),
  )

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return undefined
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(toSessionUser(currentUser))
        setLoading(false)
      },
      (authError) => {
        setError(getAuthErrorMessage(authError))
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const signInWithEmail = useCallback(async ({ email, password }) => {
    setError(null)

    try {
      const result = await signInWithEmailAndPassword(
        getConfiguredAuth(),
        email.trim(),
        password,
      )
      return result.user
    } catch (signInError) {
      setError(getAuthErrorMessage(signInError))
      throw signInError
    }
  }, [])

  const registerWithEmail = useCallback(async ({ name, email, password }) => {
    setError(null)

    try {
      const result = await createUserWithEmailAndPassword(
        getConfiguredAuth(),
        email.trim(),
        password,
      )
      const displayName = name.trim()

      if (displayName) {
        await updateProfile(result.user, { displayName })
        setUser(toSessionUser(result.user))
      }

      return result.user
    } catch (registerError) {
      setError(getAuthErrorMessage(registerError))
      throw registerError
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setError(null)

    try {
      const result = await signInWithPopup(getConfiguredAuth(), provider)
      return result.user
    } catch (signInError) {
      setError(getAuthErrorMessage(signInError))
      throw signInError
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)

    try {
      await firebaseSignOut(auth)
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError))
      throw signOutError
    }
  }, [])

  const setProfilePhoto = useCallback(async (file) => {
    setError(null)

    try {
      const currentUser = getConfiguredAuth().currentUser
      if (!currentUser) {
        const authenticationError = new Error('No hay una sesión activa.')
        authenticationError.code = 'auth/no-current-user'
        throw authenticationError
      }

      const photoURL = await uploadProfilePhoto(currentUser, file)
      await updateProfile(currentUser, { photoURL })
      setUser(toSessionUser(currentUser))
      return photoURL
    } catch (photoError) {
      setError(getAuthErrorMessage(photoError))
      throw photoError
    }
  }, [])

  const clearProfilePhoto = useCallback(async () => {
    setError(null)

    try {
      const currentUser = getConfiguredAuth().currentUser
      if (!currentUser) {
        const authenticationError = new Error('No hay una sesión activa.')
        authenticationError.code = 'auth/no-current-user'
        throw authenticationError
      }

      await deleteProfilePhoto(currentUser)
      await updateProfile(currentUser, { photoURL: getGooglePhotoURL(currentUser) || null })
      setUser(toSessionUser(currentUser))
    } catch (photoError) {
      setError(getAuthErrorMessage(photoError))
      throw photoError
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({
      clearError,
      user,
      loading,
      error,
      registerWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      setProfilePhoto,
      clearProfilePhoto,
    }),
    [clearError, clearProfilePhoto, error, loading, registerWithEmail, setProfilePhoto, signInWithEmail, signInWithGoogle, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthProvider }
