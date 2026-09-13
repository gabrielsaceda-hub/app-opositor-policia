import { requireUser } from '../_lib/auth.js'
import { syncActivities } from '../_lib/strava.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }
  const user = await requireUser(request, response)
  if (!user) return
  if (user.firebase?.sign_in_provider === 'anonymous') {
    response.status(403).json({ error: 'Google account required for Strava' })
    return
  }
  try {
    const count = await syncActivities(user.uid)
    response.status(200).json({ synced: count })
  } catch (error) {
    const status = error?.message === 'strava-not-connected' ? 409 : 502
    response.status(status).json({ error: error?.message ?? 'Strava sync failed' })
  }
}
