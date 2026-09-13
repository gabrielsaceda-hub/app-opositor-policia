// Servicio del Panel Superadmin (Client SDK).
// Todo lo sensible se valida también en firestore.rules: solo ADMIN_EMAILS puede leer/escribir aquí.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseClient'

function toISODate(value) {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString()
  return null
}

// ---------- USUARIOS ----------
export function subscribeAllUsers(onChange, maxUsers = 500) {
  const usersRef = collection(db, 'users')
  return onSnapshot(usersRef, (snapshot) => {
    onChange(
      snapshot.docs.map((d) => {
        const data = d.data()
        return {
          uid: d.id,
          nombre: data.nombre ?? '',
          email: data.email ?? '',
          emailManual: Boolean(data.emailManual),
          role: data.role ?? 'user',
          status: data.status ?? 'activo',
          plan: data.plan ?? 'gratuito',
          stravaConnected: Boolean(data.stravaConnected),
          sexo: data.sexo ?? '',
          cuerpoObjetivo: data.cuerpoObjetivo ?? '',
          peso: data.peso ?? '',
          altura: data.altura ?? '',
          objetivos: data.objetivos ?? {},
          createdAt: toISODate(data.createdAt),
          lastLoginAt: toISODate(data.lastLoginAt),
          updatedAt: toISODate(data.updatedAt),
        }
      })
        .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
        .slice(0, maxUsers),
    )
  })
}

export async function getUserMarksOnce(uid, maxMarks = 50) {
  const marksRef = collection(db, 'users', uid, 'marks')
  const marksQuery = query(marksRef, orderBy('createdAt', 'desc'), limit(maxMarks))
  const snap = await getDocs(marksQuery)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      fecha: toISODate(data.createdAt) ?? new Date().toISOString(),
    }
  })
}

const ALLOWED_ROLES = ['user', 'admin']
const ALLOWED_STATUS = ['activo', 'suspendido']
const ALLOWED_PLANS = ['gratuito', 'pro', 'club']

export async function updateUserByAdmin(targetUid, patch) {
  const clean = {}
  if (patch.nombre !== undefined) clean.nombre = String(patch.nombre).slice(0, 80)
  if (patch.email !== undefined) {
    const email = String(patch.email).trim().toLowerCase().slice(0, 120)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid-email')
    const duplicateQuery = query(collection(db, 'users'), where('email', '==', email), limit(2))
    const duplicateSnapshot = await getDocs(duplicateQuery)
    if (duplicateSnapshot.docs.some((item) => item.id !== targetUid)) {
      throw new Error('email-already-in-use')
    }
    clean.email = email
    // Marca el email como fijado por admin para que el login no lo sobrescriba.
    clean.emailManual = true
  }
  if (ALLOWED_ROLES.includes(patch.role)) clean.role = patch.role
  if (ALLOWED_STATUS.includes(patch.status)) clean.status = patch.status
  if (ALLOWED_PLANS.includes(patch.plan)) clean.plan = patch.plan
  if (patch.stravaConnected !== undefined) clean.stravaConnected = Boolean(patch.stravaConnected)
  clean.updatedAt = serverTimestamp()
  await setDoc(doc(db, 'users', targetUid), clean, { merge: true })
}

// Borra perfil + marcas en Firestore. NOTA: no puede borrar el usuario de Firebase Auth
// desde el Client SDK (haría falta Admin SDK / Cloud Function). Se marca como suspendido
// y se eliminan sus datos de la app.
export async function deleteUserDataByAdmin(targetUid) {
  const marksRef = collection(db, 'users', targetUid, 'marks')
  const marksSnap = await getDocs(marksRef)
  const batch = writeBatch(db)
  marksSnap.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(doc(db, 'users', targetUid))
  await batch.commit()
}

export async function deleteUserAccountByAdmin(targetUid) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('missing-auth-token')
  const response = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: targetUid }),
  })
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'delete-user-failed')
}

// ---------- AVISOS IN-APP ----------
export function subscribeActiveAnnouncements(onChange) {
  const ref = collection(db, 'announcements')
  const q = query(ref, where('active', '==', true))
  return onSnapshot(q, (snap) => {
    const now = Date.now()
    onChange(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => {
          const exp = a.expiresAt && typeof a.expiresAt.toDate === 'function' ? a.expiresAt.toDate().getTime() : null
          return exp === null || exp > now
        })
        .sort((a, b) => {
          const aDate = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0
          const bDate = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0
          return bDate - aDate
        })
        .slice(0, 5),
    )
  })
}

export function subscribeAllAnnouncements(onChange) {
  const ref = collection(db, 'announcements')
  return onSnapshot(ref, (snap) => {
    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const aDate = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0
        const bDate = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0
        return bDate - aDate
      })
      .slice(0, 50)
    onChange(items)
  })
}

export async function saveAnnouncement({ id = null, title, message, active = true, expiresAtISO = '' }) {
  const payload = {
    title: String(title).slice(0, 120),
    message: String(message).slice(0, 1000),
    active: Boolean(active),
    expiresAt: expiresAtISO ? new Date(expiresAtISO) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (id) {
    await setDoc(doc(db, 'announcements', id), payload, { merge: true })
    return id
  }
  const created = await addDoc(collection(db, 'announcements'), payload)
  return created.id
}

export async function deleteAnnouncement(id) {
  await deleteDoc(doc(db, 'announcements', id))
}

// ---------- EMAILS (cola Firestore para Trigger Email extension) ----------
// La extensión "Trigger Email" lee la colección `mail` y envía { to, message: { subject, html } }.
export async function queueEmail({ to, subject, html, template = 'custom' }) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('missing-auth-token')
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html, template }),
  })
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'send-email-failed')
}

export async function queueBulkEmails({ recipients, subject, html, template = 'newsletter' }) {
  // Encolamos 1 doc por lote de 50 destinatarios para no superar límites.
  const list = [...new Set(recipients.filter(Boolean))]
  for (let i = 0; i < list.length; i += 50) {
    await queueEmail({ to: list.slice(i, i + 50), subject, html, template })
  }
  return list.length
}

// ---------- PLANTILLAS ----------
export const EMAIL_TEMPLATES = {
  plan: {
    label: 'Notificación de plan',
    subject: 'Tu plan de entrenamiento ya está disponible',
    html: '<p>Hola,</p><p>Tu plan de esta semana ya está listo en <strong>App Opositor Policía</strong>. Revisa el calendario y marca tus sesiones como completadas.</p><p>¡A por ello!</p>',
  },
  mantenimiento: {
    label: 'Aviso de mantenimiento',
    subject: 'Mantenimiento programado de la plataforma',
    html: '<p>Hola,</p><p>El próximo domingo de 02:00 a 04:00 haremos mantenimiento. La app puede no estar disponible. Tus datos están a salvo.</p><p>Gracias por tu paciencia.</p>',
  },
  recordatorio: {
    label: 'Recordatorio de entrenamiento',
    subject: 'No olvides registrar tu entreno de hoy',
    html: '<p>Hola,</p><p>Hoy tienes sesión planificada. Recuerda registrarla (Strava o manual) para mantener tu racha y ajustar tu carga semanal.</p>',
  },
}

// Markdown muy básico -> HTML para el editor del newsletter.
export function markdownToHtml(md) {
  return String(md ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .split('\n')
    .map((line) => {
      if (line.startsWith('## ')) return `<h3>${line.slice(3)}</h3>`
      if (line.startsWith('# ')) return `<h2>${line.slice(2)}</h2>`
      if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`
      if (line.trim() === '') return ''
      return `<p>${line}</p>`
    })
    .join('')
}

// ---------- MÉTRICAS ----------
export function computePlatformMetrics({ users, marks }) {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const activeToday = users.filter((u) => u.lastLoginAt && now - new Date(u.lastLoginAt).getTime() < day).length
  const activeWeek = users.filter((u) => u.lastLoginAt && now - new Date(u.lastLoginAt).getTime() < 7 * day).length
  const stravaCount = marks.filter((m) => m.source === 'strava' || m.origen === 'strava').length
  const manualCount = marks.length - stravaCount
  const withNutrition = users.filter((u) => u.peso !== '' && u.altura !== '' && Object.keys(u.objetivos ?? {}).length > 0).length
  return {
    totalUsers: users.length,
    activeToday,
    activeWeek,
    totalTrainings: marks.length,
    stravaCount,
    manualCount,
    nutritionPct: users.length ? Math.round((withNutrition / users.length) * 100) : 0,
  }
}
