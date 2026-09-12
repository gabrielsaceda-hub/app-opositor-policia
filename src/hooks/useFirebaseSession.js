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
import { getMarksOnce, getProfileOnce, migrateAnonymousData } from '../services/firebase/userData'

const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

function getGoogleErrorMessage(code) {
  if (code === 'auth/popup-blocked') {
    return 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes para esta web y vuelve a pulsar "Iniciar sesión con Google".'
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Cerraste la ventana de Google antes de elegir cuenta. Vuelve a intentarlo y selecciona tu cuenta.'
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Ya hay una ventana de Google abierta. Ciérrala y vuelve a intentarlo una sola vez.'
  }
  return `No se pudo iniciar sesión con Google (${code ?? 'error desconocido'}).`
}

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
      // Guardamos los datos de la sesión anónima ANTES de vincular: si el email
      // de Google ya estaba registrado, los migramos a la cuenta existente para no perderlos.
      const anonUid = auth.currentUser?.isAnonymous ? auth.currentUser.uid : null
      let anonProfile = null
      let anonMarks = []
      if (anonUid) {
        try {
          anonProfile = await getProfileOnce(anonUid)
          anonMarks = await getMarksOnce(anonUid)
        } catch {
          anonProfile = null
          anonMarks = []
        }
      }

      let alreadyRegistered = false
      if (auth.currentUser?.isAnonymous) {
        try {
          await linkWithPopup(auth.currentUser, provider)
        } catch (linkError) {
          if (
            linkError?.code !== 'auth/credential-already-in-use' &&
            linkError?.code !== 'auth/account-exists-with-different-credential'
          ) {
            throw linkError
          }
          // El email ya tiene cuenta: entramos en ella y trasladamos los datos anónimos.
          alreadyRegistered = true
          await signInWithPopup(auth, provider)
          const targetUid = auth.currentUser?.uid
          if (targetUid && (anonProfile || anonMarks.length > 0)) {
            try {
              await migrateAnonymousData(anonProfile, anonMarks, targetUid)
            } catch {
              // Si la migración falla, la sesión queda iniciada igualmente.
            }
          }
        }
      } else {
        await signInWithPopup(auth, provider)
      }

      setError('')
      return { alreadyRegistered }
    } catch (authError) {
      setError(getGoogleErrorMessage(authError?.code))
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
