import crypto from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebaseAdmin.js'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function encryptionKey() {
  const key = Buffer.from(requireEnv('STRAVA_TOKEN_ENCRYPTION_KEY'), 'base64')
  if (key.length !== 32) throw new Error('STRAVA_TOKEN_ENCRYPTION_KEY must decode to 32 bytes')
  return key
}

export function signState(uid) {
  const payload = Buffer.from(JSON.stringify({ uid, exp: Date.now() + 10 * 60 * 1000 })).toString('base64url')
  const signature = crypto.createHmac('sha256', requireEnv('STRAVA_STATE_SECRET')).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyState(state) {
  const [payload, signature] = String(state ?? '').split('.')
  if (!payload || !signature) throw new Error('invalid-state')
  const expected = crypto.createHmac('sha256', requireEnv('STRAVA_STATE_SECRET')).update(payload).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('invalid-state')
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  if (!parsed.uid || parsed.exp < Date.now()) throw new Error('expired-state')
  return parsed
}

export function encryptToken(token) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`
}

export function decryptToken(value) {
  const [ivRaw, tagRaw, encryptedRaw] = String(value ?? '').split('.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivRaw, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64url')), decipher.final()]).toString('utf8')
}

export async function exchangeCode(code) {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: requireEnv('STRAVA_CLIENT_ID'),
      client_secret: requireEnv('STRAVA_CLIENT_SECRET'),
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!response.ok) throw new Error(`strava-token-exchange-${response.status}`)
  return response.json()
}

export async function saveConnection(uid, tokenData) {
  await getAdminDb().collection('stravaConnections').doc(uid).set({
    athleteId: String(tokenData.athlete?.id ?? ''),
    refreshToken: encryptToken(tokenData.refresh_token),
    accessToken: encryptToken(tokenData.access_token),
    expiresAt: Number(tokenData.expires_at ?? 0),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })
  await getAdminDb().collection('users').doc(uid).set({ stravaConnected: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
}

export async function getAccessToken(uid) {
  const ref = getAdminDb().collection('stravaConnections').doc(uid)
  const snapshot = await ref.get()
  if (!snapshot.exists) throw new Error('strava-not-connected')
  const connection = snapshot.data()
  if (Number(connection.expiresAt) > Math.floor(Date.now() / 1000) + 60) return decryptToken(connection.accessToken)

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: requireEnv('STRAVA_CLIENT_ID'),
      client_secret: requireEnv('STRAVA_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: decryptToken(connection.refreshToken),
    }),
  })
  if (!response.ok) throw new Error(`strava-refresh-${response.status}`)
  const tokenData = await response.json()
  await saveConnection(uid, tokenData)
  return tokenData.access_token
}

function dayName(date) {
  return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()]
}

export async function saveStravaActivity(uid, activity) {
  const start = String(activity.start_date_local ?? activity.start_date ?? '')
  const date = start.slice(0, 10)
  if (!date || !activity.id) return
  const localDate = new Date(`${date}T12:00:00`)
  await getAdminDb().collection('users').doc(uid).collection('activities').doc(String(activity.id)).set({
    sport: String(activity.sport_type ?? activity.type ?? 'Actividad').slice(0, 40),
    distance: String(Number(activity.distance ?? 0) / 1000),
    duration: String(Math.round(Number(activity.moving_time ?? 0) / 60)),
    avgHr: activity.average_heartrate == null ? '' : String(Math.round(activity.average_heartrate)),
    rpe: '',
    watts: activity.average_watts == null ? '' : String(Math.round(activity.average_watts)),
    day: dayName(localDate),
    date,
    source: 'strava',
    stravaId: String(activity.id),
    name: String(activity.name ?? '').slice(0, 120),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })
}

export async function fetchAndSaveActivity(uid, activityId) {
  const token = await getAccessToken(uid)
  const response = await fetch(`https://www.strava.com/api/v3/activities/${encodeURIComponent(activityId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`strava-activity-${response.status}`)
  const activity = await response.json()
  await saveStravaActivity(uid, activity)
}

export async function syncActivities(uid) {
  const token = await getAccessToken(uid)
  const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=100&page=1', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`strava-activities-${response.status}`)
  const activities = await response.json()
  for (const activity of activities) await saveStravaActivity(uid, activity)
  return activities.length
}

export async function findUidByAthlete(athleteId) {
  const snapshot = await getAdminDb().collection('stravaConnections').where('athleteId', '==', String(athleteId)).limit(1).get()
  return snapshot.empty ? null : snapshot.docs[0].id
}

export async function deleteStravaActivity(uid, activityId) {
  await getAdminDb().collection('users').doc(uid).collection('activities').doc(String(activityId)).delete()
}
