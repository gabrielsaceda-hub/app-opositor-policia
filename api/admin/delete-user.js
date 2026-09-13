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
    const publicMarks = await db.collection('publicMarks').where('userId', '==', targetUid).get()
    const commits = []
    let batch = db.batch()
    let pending = 0
    for (const docItem of publicMarks.docs) {
      batch.delete(docItem.ref)
      pending += 1
      if (pending >= 400) {
        commits.push(batch.commit())
        batch = db.batch()
        pending = 0
      }
    }
    if (pending > 0) commits.push(batch.commit())
    await Promise.all(commits)
    try {
      await getAdminAuth().deleteUser(targetUid)
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error
    }
    response.status(200).json({ deleted: true, uid: targetUid, publicMarksDeleted: publicMarks.size })
  } catch {
    response.status(500).json({ error: 'Could not delete user' })
  }
}
