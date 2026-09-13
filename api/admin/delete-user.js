import { requireAdmin } from '../_lib/auth.js'
import { getAdminAuth, getAdminDb } from '../_lib/firebaseAdmin.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }
  const admin = await requireAdmin(request, response)
  if (!admin) return
  const targetUid = request.body?.uid
  if (typeof targetUid !== 'string' || !/^[A-Za-z0-9_-]{20,128}$/.test(targetUid)) {
    response.status(400).json({ error: 'Invalid uid' })
    return
  }
  if (targetUid === admin.uid) {
    response.status(400).json({ error: 'An administrator cannot delete their own account' })
    return
  }
  try {
    const db = getAdminDb()
    await db.recursiveDelete(db.collection('users').doc(targetUid))
    await db.collection('stravaConnections').doc(targetUid).delete()
    try {
      await getAdminAuth().deleteUser(targetUid)
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error
    }
    response.status(200).json({ deleted: true, uid: targetUid })
  } catch {
    response.status(500).json({ error: 'Could not delete user' })
  }
}
