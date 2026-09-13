import { deleteStravaActivity, fetchAndSaveActivity, findUidByAthlete } from '../_lib/strava.js'

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
    const uid = await findUidByAthlete(event?.owner_id)
    if (!uid) {
      response.status(202).json({ received: true })
      return
    }
    try {
      if (event.object_type === 'activity' && ['create', 'update'].includes(event.aspect_type)) {
        await fetchAndSaveActivity(uid, event.object_id)
      } else if (event.object_type === 'activity' && event.aspect_type === 'delete') {
        await deleteStravaActivity(uid, event.object_id)
      }
    } catch (error) {
      console.error('Strava webhook processing failed', error)
      response.status(500).json({ error: 'Webhook processing failed' })
      return
    }
    response.status(200).json({ received: true })
    return
  }

  response.status(405).json({ error: 'Method not allowed' })
}
