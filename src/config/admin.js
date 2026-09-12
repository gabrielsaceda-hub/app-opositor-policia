export const ADMIN_EMAILS = ['oposicionfisica@gmail.com', 'gabriel.saceda@gmail.com']

// Bootstrap: estos emails siempre son admin aunque el doc de Firestore aún no tenga rol.
// Después el rol vive en users/{uid}.role = 'admin' | 'user' (+ status/plan).
export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email ?? '').toLowerCase())
}

export function isAdminUser(user, roleDoc = null) {
  if (!user || user.isAnonymous) return false
  if (roleDoc?.role === 'admin') return true
  return isAdminEmail(user.email)
}

export function isSuspendedUser(roleDoc = null) {
  return roleDoc?.status === 'suspendido'
}
