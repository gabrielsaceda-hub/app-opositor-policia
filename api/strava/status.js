import { requireUser } from '../_lib/auth.js'
import { getConnectionStatus } from '../_lib/strava.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }
  const user = await requireUser(request, response)
  if (!user) return
  if (user.firebase?.sign_in_provider === 'anonymous') {
    response.status(200).json({ connected: false, status: 'disconnected', lastSyncAt: null })
    return
  }
  try {
    response.status(200).json(await getConnectionStatus(user.uid))
  } catch {
    response.status(502).json({ error: 'Could not read Strava status' })
  }
}
