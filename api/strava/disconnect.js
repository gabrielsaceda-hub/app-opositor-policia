import { requireUser } from '../_lib/auth.js'
import { disconnectStrava } from '../_lib/strava.js'

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
    await disconnectStrava(user.uid)
    response.status(200).json({ disconnected: true, activitiesPreserved: true })
  } catch (error) {
    response.status(502).json({ error: error?.message === 'strava-not-connected' ? error.message : 'Could not disconnect Strava' })
  }
}
