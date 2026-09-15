import test from 'node:test'
import assert from 'node:assert/strict'
import { getActivityLoad, isActivityCompleted } from '../src/services/training/activityLoad.js'
import { getStravaMatchCandidates } from '../src/services/training/stravaMatching.js'

test('Strava usa minutos externos y no inventa RPE', () => {
  assert.equal(getActivityLoad({ source: 'strava', duration: '60', rpe: '' }), 60)
  assert.equal(getActivityLoad({ source: 'strava', duration: '60', rpe: '10' }), 60)
  assert.equal(isActivityCompleted({ source: 'strava', status: 'importada', planningMatchStatus: 'unreviewed' }), false)
  assert.equal(isActivityCompleted({ source: 'strava', status: 'completada', planningMatchStatus: 'confirmed' }), true)
})

test('matching requiere fecha, deporte, duración compatible y confirmación posterior', () => {
  const plannedWeek = [{
    day: 'Lunes',
    date: '2026-09-14',
    planned: { title: 'Carrera específica 1000 m' },
    activities: [],
  }]
  const activity = { source: 'strava', sport: 'Run', duration: '60', date: '2026-09-14', planningMatchStatus: 'unreviewed' }
  assert.equal(getStravaMatchCandidates({ activity, plannedWeek, plannedDuration: '60' }).length, 1)
  assert.equal(getStravaMatchCandidates({ activity: { ...activity, date: '2026-09-15' }, plannedWeek, plannedDuration: '60' }).length, 0)
  assert.equal(getStravaMatchCandidates({ activity: { ...activity, duration: '20' }, plannedWeek, plannedDuration: '60' }).length, 0)
  assert.equal(getStravaMatchCandidates({ activity: { ...activity, planningMatchStatus: 'confirmed' }, plannedWeek, plannedDuration: '60' }).length, 0)
})

test('una actividad externa en día de descanso no puede ser matching de una sesión', () => {
  const activity = { source: 'strava', sport: 'Run', duration: '60', date: '2026-09-14', planningMatchStatus: 'unreviewed' }
  const plannedWeek = [{ day: 'Lunes', date: '2026-09-14', planned: null, activities: [] }]
  assert.equal(getStravaMatchCandidates({ activity, plannedWeek, plannedDuration: '60' }).length, 0)
})

test('OAuth state incluye nonce verificable y caducidad', async () => {
  globalThis.process.env.STRAVA_STATE_SECRET = 'test-state-secret'
  const { createState, verifyState } = await import('../api/_lib/strava.js')
  const created = createState('user-1')
  const parsed = verifyState(created.state)
  assert.equal(parsed.uid, 'user-1')
  assert.equal(parsed.nonce, created.nonce)
})

test('intercambio OAuth usa formulario compatible con Strava', async () => {
  globalThis.process.env.STRAVA_CLIENT_ID = 'test-client'
  globalThis.process.env.STRAVA_CLIENT_SECRET = 'test-secret'
  const { exchangeCode } = await import('../api/_lib/strava.js')
  const previousFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://www.strava.com/oauth/token')
    assert.equal(options.headers['Content-Type'], 'application/x-www-form-urlencoded')
    assert.equal(options.body.get('grant_type'), 'authorization_code')
    assert.equal(options.body.get('code'), 'test-code')
    return { ok: true, json: async () => ({}) }
  }
  try {
    await exchangeCode('test-code')
  } finally {
    globalThis.fetch = previousFetch
  }
})
