import { getAdminAuth, getAdminDb } from './firebaseAdmin.js'

const ADMIN_EMAILS = new Set(['oposicionfisica@gmail.com', 'gabriel.saceda@gmail.com'])

export async function verifyRequestUser(request) {
  const header = request.headers?.authorization ?? request.headers?.Authorization ?? ''
  if (!header.startsWith('Bearer ')) throw new Error('missing-auth-token')
  return getAdminAuth().verifyIdToken(header.slice(7))
}

export async function isAdmin(decodedToken) {
  if (decodedToken.admin === true || ADMIN_EMAILS.has(String(decodedToken.email ?? '').toLowerCase())) return true
  const profile = await getAdminDb().collection('users').doc(decodedToken.uid).get()
  return profile.exists && profile.data().role === 'admin'
}

export async function requireUser(request, response) {
  try {
    return await verifyRequestUser(request)
  } catch {
    response.status(401).json({ error: 'Unauthorized' })
    return null
  }
}

export async function requireAdmin(request, response) {
  const user = await requireUser(request, response)
  if (!user) return null
  if (!(await isAdmin(user))) {
    response.status(403).json({ error: 'Admin role required' })
    return null
  }
  return user
}
