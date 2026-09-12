export default async function handler(request, response) {
  if (request.method === 'GET') {
    const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
    const mode = request.query['hub.mode']
    const token = request.query['hub.verify_token']
    const challenge = request.query['hub.challenge']

    if (mode === 'subscribe' && token && token === verifyToken) {
      response.status(200).json({ 'hub.challenge': challenge })
      return
    }

    response.status(403).json({ error: 'Invalid Strava webhook verification' })
    return
  }

  if (request.method === 'POST') {
    const event = request.body
    // Production note: validate owner_id/subscription, then persist activity updates in Firestore.
    console.log('Strava webhook event', event)
    response.status(200).json({ received: true })
    return
  }

  response.status(405).json({ error: 'Method not allowed' })
}
