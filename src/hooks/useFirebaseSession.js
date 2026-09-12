import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '../services/firebase/firebaseClient'

const provider = new GoogleAuthProvider()

export function useFirebaseSession() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setIsLoading(false)
        return
      }

      try {
        const credentials = await signInAnonymously(auth)
        setUser(credentials.user)
        setError('')
      } catch (authError) {
        if (authError?.code === 'auth/operation-not-allowed') {
          setError('Activa el método Anónimo en Firebase Authentication para usar la app.')
        } else {
          setError(`No se pudo iniciar sesión anónima en Firebase (${authError?.code ?? 'error desconocido'}).`)
        }
      } finally {
        setIsLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    setIsAuthActionLoading(true)

    try {
      if (auth.currentUser?.isAnonymous) {
        try {
          await linkWithPopup(auth.currentUser, provider)
        } catch (linkError) {
          if (linkError?.code !== 'auth/credential-already-in-use') throw linkError
          await signInWithPopup(auth, provider)
        }
      } else {
        await signInWithPopup(auth, provider)
      }

      setError('')
    } catch (authError) {
      setError(`No se pudo iniciar sesión con Google (${authError?.code ?? 'error desconocido'}).`)
      throw new Error('google-auth-error', { cause: authError })
    } finally {
      setIsAuthActionLoading(false)
    }
  }

  const signOutAndContinueAnonymous = async () => {
    setIsAuthActionLoading(true)

    try {
      await signOut(auth)
      await signInAnonymously(auth)
      setError('')
    } catch (authError) {
      setError(`No se pudo cerrar sesión de Google correctamente (${authError?.code ?? 'error desconocido'}).`)
      throw new Error('google-signout-error', { cause: authError })
    } finally {
      setIsAuthActionLoading(false)
    }
  }

  return {
    user,
    isLoading,
    isAuthActionLoading,
    error,
    signInWithGoogle,
    signOutAndContinueAnonymous,
  }
}
