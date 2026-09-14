import { requireUser } from './_lib/auth.js'
import { getAdminDb } from './_lib/firebaseAdmin.js'

function sanitize(value, max = 3000) {
  return JSON.stringify(value ?? null).slice(0, max)
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }
  const user = await requireUser(request, response)
  if (!user) return
  if (user.firebase?.sign_in_provider === 'anonymous') {
    response.status(403).json({ error: 'Google account required for Coach IA' })
    return
  }
  if (!process.env.AI_API_KEY) {
    response.status(503).json({ error: 'AI provider is not configured' })
    return
  }
  const body = request.body ?? {}
  const prompt = typeof body.question === 'string' ? body.question.trim().slice(0, 1000) : ''
  if (!prompt) {
    response.status(400).json({ error: 'Question is required' })
    return
  }
  // Tope diario por usuario para acotar coste.
  const limit = Number(process.env.COACH_DAILY_LIMIT) || 10
  try {
    const usageRef = getAdminDb().collection('users').doc(user.uid).collection('coachUsage').doc(todayKey())
    const allowed = await getAdminDb().runTransaction(async (tx) => {
      const snapshot = await tx.get(usageRef)
      const count = Number(snapshot.exists ? snapshot.data().count : 0) || 0
      if (count >= limit) return false
      tx.set(usageRef, { count: count + 1 }, { merge: true })
      return true
    })
    if (!allowed) {
      response.status(429).json({ error: 'Daily Coach limit reached' })
      return
    }
  } catch {
    response.status(500).json({ error: 'Could not check Coach usage' })
    return
  }
  // Resumen computado en cliente; se acepta el formato anterior por compatibilidad.
  const context = body.summary ?? {
    profile: body.profile,
    marks: body.marks,
    activities: body.activities,
    wellbeing: body.wellbeing,
  }
  try {
    const upstream = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 700,
        messages: [
          { role: 'system', content: 'Eres un coach educativo para preparación física de oposiciones. Da recomendaciones generales, prudentes y accionables. No diagnostiques, no prescribas tratamientos y deriva a profesionales ante dolor, lesión o síntomas. Responde en español.' },
          { role: 'user', content: `Contexto del atleta: ${sanitize(context)}\nPregunta: ${prompt}` },
        ],
      }),
    })
    const payload = await upstream.json()
    if (!upstream.ok) {
      response.status(502).json({ error: 'AI provider error' })
      return
    }
    const answer = payload.choices?.[0]?.message?.content
    if (typeof answer !== 'string' || !answer.trim()) {
      response.status(502).json({ error: 'AI provider returned no answer' })
      return
    }
    response.status(200).json({ answer: answer.slice(0, 6000), userId: user.uid })
  } catch {
    response.status(502).json({ error: 'AI provider unavailable' })
  }
}
