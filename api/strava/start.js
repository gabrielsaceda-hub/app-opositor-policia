import { requireUser } from '../_lib/auth.js'
import { signState } from '../_lib/strava.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }
  const user = await requireUser(request, response)
  if (!user) return
  if (user.firebase?.sign_in_provider === 'anonymous') {
    response.status(403).json({ error: 'Google account required for Strava' })
    return
  }
  const clientId = process.env.STRAVA_CLIENT_ID || process.env.VITE_STRAVA_CLIENT_ID
  if (!clientId) {
    response.status(503).json({ error: 'Strava is not configured' })
    return
  }
  const origin = process.env.APP_ORIGIN || `https://${request.headers.host}`
  const redirectUri = `${origin}/api/strava/callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
    state: signState(user.uid),
  })
  response.status(200).json({ url: `https://www.strava.com/oauth/authorize?${params.toString()}` })
}
