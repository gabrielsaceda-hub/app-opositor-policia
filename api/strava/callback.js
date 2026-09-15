import { exchangeCode, saveConnection, verifyState } from '../_lib/strava.js'

function getCookie(request, name) {
  const cookies = String(request.headers?.cookie ?? '').split(';')
  const entry = cookies.find((item) => item.trim().startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : ''
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { code, error, state } = request.query
  if (error) {
    response.status(400).send('Strava authorization was not completed')
    return
  }

  if (!code) {
    response.status(400).send('Missing Strava authorization code')
    return
  }

  if (!state) {
    response.status(400).send('Missing Strava state')
    return
  }

  try {
    const parsedState = verifyState(state)
    if (getCookie(request, 'strava_oauth_state') !== parsedState.nonce) throw new Error('invalid-state')
    response.setHeader('Set-Cookie', 'strava_oauth_state=; Max-Age=0; Path=/api/strava/callback; HttpOnly; SameSite=Lax')
    const tokenData = await exchangeCode(code)
    await saveConnection(parsedState.uid, tokenData)
    response.redirect(302, '/calendario?strava=connected')
  } catch (error) {
    console.error('Strava OAuth callback failed', error)
    response.status(502).send('Could not complete Strava connection')
    return
  }
}
