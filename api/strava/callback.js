import { exchangeCode, saveConnection, verifyState } from '../_lib/strava.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { code, error, state } = request.query
  if (error) {
    response.status(400).send(`Strava OAuth error: ${error}`)
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
    const { uid } = verifyState(state)
    const tokenData = await exchangeCode(code)
    await saveConnection(uid, tokenData)
    response.redirect(302, '/calendario?strava=connected')
  } catch (error) {
    response.status(502).send(`Could not complete Strava connection: ${error?.message ?? 'unknown error'}`)
    return
  }
}
