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

export function signState(uid, nonce = crypto.randomBytes(24).toString('base64url')) {
  const payload = Buffer.from(JSON.stringify({ uid, nonce, exp: Date.now() + 10 * 60 * 1000 })).toString('base64url')
  const signature = crypto.createHmac('sha256', requireEnv('STRAVA_STATE_SECRET')).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function createState(uid) {
  const nonce = crypto.randomBytes(24).toString('base64url')
  return { state: signState(uid, nonce), nonce }
}

export function verifyState(state) {
  const [payload, signature] = String(state ?? '').split('.')
  if (!payload || !signature) throw new Error('invalid-state')
  const expected = crypto.createHmac('sha256', requireEnv('STRAVA_STATE_SECRET')).update(payload).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('invalid-state')
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  if (!parsed.uid || !parsed.nonce || parsed.exp < Date.now()) throw new Error('expired-state')
  return parsed
}

export function getAppOrigin() {
  const origin = requireEnv('APP_ORIGIN').replace(/\/$/, '')
  const parsed = new URL(origin)
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    throw new Error('APP_ORIGIN must use https')
  }
  return origin
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
  const ref = getAdminDb().collection('stravaConnections').doc(uid)
  const previous = (await ref.get()).data() ?? {}
  const scopes = tokenData.scope
    ? String(tokenData.scope).split(/\s+/).filter(Boolean)
    : Array.isArray(previous.scopes)
      ? previous.scopes
      : String(previous.scopes ?? '').split(/\s+/).filter(Boolean)
  await ref.set({
    athleteId: String(tokenData.athlete?.id ?? previous.athleteId ?? ''),
    refreshToken: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : previous.refreshToken,
    accessToken: tokenData.access_token ? encryptToken(tokenData.access_token) : previous.accessToken,
    expiresAt: Number(tokenData.expires_at ?? previous.expiresAt ?? 0),
    scopes,
    connectedAt: previous.connectedAt ?? FieldValue.serverTimestamp(),
    status: 'connected',
    lastError: '',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })
  await getAdminDb().collection('users').doc(uid).set({ stravaConnected: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
}

export async function getAccessToken(uid) {
  const ref = getAdminDb().collection('stravaConnections').doc(uid)
  const snapshot = await ref.get()
  if (!snapshot.exists) throw new Error('strava-not-connected')
  const connection = snapshot.data()
  if (Number(connection.expiresAt) > Math.floor(Date.now() / 1000) + 3600) return decryptToken(connection.accessToken)

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
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) await markStravaNeedsReconnect(uid, `strava-refresh-${response.status}`)
    throw new Error(`strava-refresh-${response.status}`)
  }
  const tokenData = await response.json()
  await saveConnection(uid, tokenData)
  return tokenData.access_token
}

export async function getConnectionStatus(uid) {
  const snapshot = await getAdminDb().collection('stravaConnections').doc(uid).get()
  if (!snapshot.exists) return { connected: false, status: 'disconnected', lastSyncAt: null }
  const connection = snapshot.data()
  const status = connection.status ?? 'connected'
  return {
    connected: status === 'connected',
    status,
    lastSyncAt: connection.lastSyncAt ? new Date(Number(connection.lastSyncAt) * 1000).toLocaleString('es-ES') : null,
    lastError: connection.lastError ?? '',
  }
}

export async function markStravaNeedsReconnect(uid, errorMessage = 'authorization-required') {
  await getAdminDb().collection('stravaConnections').doc(uid).set({
    status: 'reauthorization_required',
    lastError: String(errorMessage).slice(0, 160),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })
  await getAdminDb().collection('users').doc(uid).set({ stravaConnected: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
}

export async function disconnectStrava(uid) {
  const ref = getAdminDb().collection('stravaConnections').doc(uid)
  const snapshot = await ref.get()
  if (snapshot.exists) {
    const connection = snapshot.data()
    const token = connection.refreshToken ? decryptToken(connection.refreshToken) : connection.accessToken ? decryptToken(connection.accessToken) : ''
    if (token) {
      const credentials = Buffer.from(`${requireEnv('STRAVA_CLIENT_ID')}:${requireEnv('STRAVA_CLIENT_SECRET')}`).toString('base64')
      const response = await fetch('https://www.strava.com/oauth/revoke', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ token }),
      })
      if (!response.ok && response.status !== 401) throw new Error(`strava-revoke-${response.status}`)
    }
  }
  await ref.delete()
  await getAdminDb().collection('users').doc(uid).set({ stravaConnected: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
}

function dayName(date) {
  return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()]
}

export async function saveStravaActivity(uid, activity) {
  const start = String(activity.start_date_local ?? activity.start_date ?? '')
  const date = start.slice(0, 10)
  if (!date || !activity.id) return
  const localDate = new Date(`${date}T12:00:00`)
  const ref = getAdminDb().collection('users').doc(uid).collection('activities').doc(String(activity.id))
  const previous = (await ref.get()).data() ?? {}
  const sport = String(activity.sport_type ?? activity.type ?? 'Actividad').slice(0, 40)
  const distanceMeters = Number(activity.distance ?? 0)
  const durationSeconds = Number(activity.moving_time ?? 0)
  const speed = Number(activity.average_speed ?? 0)
  const isPaceSport = /run|walk|hike/i.test(sport)
  const paceSecondsPerKm = isPaceSport && speed > 0 ? Math.round(1000 / speed) : null
  const matchStatus = previous.planningMatchStatus ?? 'unreviewed'
  await ref.set({
    sport,
    distance: String(Math.round((distanceMeters / 1000) * 100) / 100),
    duration: String(Math.round(durationSeconds / 60)),
    distanceMeters,
    durationSeconds,
    startedAt: String(activity.start_date_local ?? activity.start_date ?? ''),
    paceSecondsPerKm,
    elevationGainMeters: Number(activity.total_elevation_gain ?? 0),
    avgSpeedMps: speed || null,
    avgHr: activity.average_heartrate == null ? '' : String(Math.round(activity.average_heartrate)),
    rpe: '',
    watts: activity.average_watts == null ? '' : String(Math.round(activity.average_watts)),
    day: dayName(localDate),
    date,
    source: 'strava',
    stravaId: String(activity.id),
    name: String(activity.name ?? '').slice(0, 120),
    status: matchStatus === 'confirmed' ? 'completada' : 'importada',
    planningMatchStatus: matchStatus,
    stravaUpdatedAt: String(activity.updated_at ?? activity.start_date ?? ''),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })
}

export async function fetchAndSaveActivity(uid, activityId) {
  const token = await getAccessToken(uid)
  const response = await fetch(`https://www.strava.com/api/v3/activities/${encodeURIComponent(activityId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) await markStravaNeedsReconnect(uid, `strava-activity-${response.status}`)
    throw new Error(`strava-activity-${response.status}`)
  }
  const activity = await response.json()
  await saveStravaActivity(uid, activity)
}

export async function syncActivities(uid) {
  const ref = getAdminDb().collection('stravaConnections').doc(uid)
  const connectionSnapshot = await ref.get()
  if (!connectionSnapshot.exists) throw new Error('strava-not-connected')
  const connection = connectionSnapshot.data()
  const token = await getAccessToken(uid)
  const after = Number(connection.lastSyncAt) > 0 ? Math.max(0, Number(connection.lastSyncAt) - 24 * 60 * 60) : null
  let page = Number(connection.syncPage) > 0 ? Number(connection.syncPage) : 1
  let synced = 0
  const maxPages = 5
  const lastPage = page + maxPages - 1
  let complete = false
  while (page <= lastPage) {
    const params = new URLSearchParams({ per_page: '100', page: String(page) })
    if (after) params.set('after', String(after))
    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) await markStravaNeedsReconnect(uid, `strava-activities-${response.status}`)
      throw new Error(`strava-activities-${response.status}`)
    }
    const activities = await response.json()
    for (const activity of activities) {
      await saveStravaActivity(uid, activity)
      synced += 1
    }
    if (activities.length < 100) {
      complete = true
      break
    }
    page += 1
  }
  if (!complete) {
    await ref.set({ syncPage: page, lastSyncStatus: 'partial', updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    return { synced, pages: maxPages, partial: true, lastSyncAt: null }
  }
  const lastSyncAt = Math.floor(Date.now() / 1000)
  await ref.set({ lastSyncAt, syncPage: FieldValue.delete(), lastSyncStatus: 'ok', lastError: '', updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  return { synced, pages: page, lastSyncAt: new Date(lastSyncAt * 1000).toLocaleString('es-ES') }
}

export async function findUidByAthlete(athleteId) {
  const snapshot = await getAdminDb().collection('stravaConnections').where('athleteId', '==', String(athleteId)).limit(1).get()
  return snapshot.empty ? null : snapshot.docs[0].id
}

export async function deleteStravaActivity(uid, activityId) {
  await getAdminDb().collection('users').doc(uid).collection('activities').doc(String(activityId)).delete()
}
