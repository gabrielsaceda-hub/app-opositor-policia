// Hook: combina bootstrap por email + rol en Firestore (users/{uid}.role).
// Devuelve { isAdmin, roleDoc, isLoading } para proteger /admin.
import { useEffect, useState } from 'react'
import { isAdminEmail } from '../config/admin'
import { subscribeUserRole } from '../services/firebase/userData'

export function useAdminRole(user) {
  const [roleDoc, setRoleDoc] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid || user.isAnonymous) {
      // Reset intencionado al cerrar sesión / pasar a anónimo (no es un render en cascada).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleDoc(null)
      setIsLoading(false)
      return undefined
    }
    const unsub = subscribeUserRole(user.uid, (next) => {
      setRoleDoc(next)
      setIsLoading(false)
    })
    return unsub
  }, [user])

  const isAdmin = Boolean(user && !user.isAnonymous && (roleDoc?.role === 'admin' || isAdminEmail(user.email)))

  return { isAdmin, roleDoc, isLoading }
}
