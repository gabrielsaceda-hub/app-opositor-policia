export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { code, error } = request.query
  if (error) {
    response.status(400).send(`Strava OAuth error: ${error}`)
    return
  }

  if (!code) {
    response.status(400).send('Missing Strava authorization code')
    return
  }

  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    response.status(500).send('Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET')
    return
  }

  const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    const message = await tokenResponse.text()
    response.status(502).send(`Could not exchange Strava code: ${message}`)
    return
  }

  const tokenData = await tokenResponse.json()
  // Production note: encrypt and store tokenData by Firebase user from a secure session.
  response.redirect(302, `/?strava=connected&athlete=${tokenData.athlete?.id ?? ''}`)
}
