import { requireAdmin } from '../_lib/auth.js'
import { getAdminDb } from '../_lib/firebaseAdmin.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }
  const admin = await requireAdmin(request, response)
  if (!admin) return
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
  const callbackUrl = `${process.env.APP_ORIGIN || `https://${request.headers.host}`}/api/strava/webhook`
  if (!clientId || !clientSecret || !verifyToken) {
    response.status(503).json({ error: 'Strava webhook is not configured' })
    return
  }
  const upstream = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, callback_url: callbackUrl, verify_token: verifyToken }),
  })
  const payload = await upstream.json()
  if (!upstream.ok) {
    response.status(502).json({ error: 'Strava webhook registration failed', details: payload })
    return
  }
  await getAdminDb().collection('settings').doc('strava').set({ webhookSubscriptionId: payload.id, callbackUrl }, { merge: true })
  response.status(200).json({ registered: true, subscriptionId: payload.id, requestedBy: admin.uid })
}
