import { requireUser } from '../_lib/auth.js'
import { createState, getAppOrigin } from '../_lib/strava.js'

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
  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) {
    response.status(503).json({ error: 'Strava is not configured' })
    return
  }
  let origin
  try {
    origin = getAppOrigin()
  } catch {
    response.status(503).json({ error: 'Strava origin is not configured' })
    return
  }
  const redirectUri = `${origin}/api/strava/callback`
  const { state, nonce } = createState(user.uid)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
    state,
  })
  const secureCookie = origin.startsWith('https://') ? '; Secure' : ''
  response.setHeader('Set-Cookie', `strava_oauth_state=${nonce}; Max-Age=600; Path=/api/strava/callback; HttpOnly; SameSite=Lax${secureCookie}`)
  response.status(200).json({ url: `https://www.strava.com/oauth/authorize?${params.toString()}` })
}
