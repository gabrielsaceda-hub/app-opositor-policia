import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebaseClient'

export function subscribeProfile(uid, onChange) {
  const profileRef = doc(db, 'users', uid)

  return onSnapshot(profileRef, (snapshot) => {
    const data = snapshot.exists() ? snapshot.data() : {}
    onChange({
      nombre: data.nombre ?? '',
      sexo: data.sexo ?? '',
      cuerpoObjetivo: data.cuerpoObjetivo ?? '',
      peso: data.peso ?? '',
      altura: data.altura ?? '',
      edad: data.edad ?? '',
      fechaTipo: data.fechaTipo ?? 'aproximada',
      fechaConcreta: data.fechaConcreta ?? '',
      semanasAprox: data.semanasAprox ?? '',
      objetivos: data.objetivos ?? {},
      diasEntreno: data.diasEntreno ?? [],
      duracionSesion: data.duracionSesion ?? '60',
      experiencia: data.experiencia ?? 'intermedio',
      objetivoEntreno: data.objetivoEntreno ?? 'mejorar-nota',
      material: data.material ?? {},
      lesiones: data.lesiones ?? '',
    })
  })
}

// Suscripción ligera al doc de rol/estado del usuario actual (para RBAC).
export function subscribeUserRole(uid, onChange) {
  const profileRef = doc(db, 'users', uid)
  return onSnapshot(profileRef, (snapshot) => {
    const data = snapshot.exists() ? snapshot.data() : {}
    onChange({
      role: data.role ?? 'user',
      status: data.status ?? 'activo',
      plan: data.plan ?? 'gratuito',
      email: data.email ?? '',
    })
  })
}

// Crea/actualiza metadatos de cuenta al iniciar sesión (email, createdAt, lastLoginAt).
// No pisa el perfil deportivo: usa merge y solo rellena createdAt si no existe.
export async function ensureUserMetadata(uid, { email = '', isAnonymous = false } = {}) {
  const ref = doc(db, 'users', uid)
  const patch = {
    email: isAnonymous ? '' : String(email).trim().toLowerCase(),
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (!isAnonymous) {
    // createdAt solo se fija la primera vez: lo intentamos con merge + campo si falta.
    // Para no leer antes de escribir, usamos setDoc merge con createdAt solo si es nuevo
    // mediante transacción ligera.
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref)
      if (!snap.exists()) {
        transaction.set(ref, { ...patch, role: 'user', status: 'activo', plan: 'gratuito', createdAt: serverTimestamp() })
      } else {
        // Si el admin fijó manualmente el email de contacto, el login no lo sobrescribe.
        const data = snap.data()
        const safePatch = { ...patch }
        if (data.email) delete safePatch.email
        if (!data.createdAt) safePatch.createdAt = serverTimestamp()
        if (!data.role) safePatch.role = 'user'
        if (!data.status) safePatch.status = 'activo'
        if (!data.plan) safePatch.plan = 'gratuito'
        transaction.set(ref, safePatch, { merge: true })
      }
    })
    return
  }
  await setDoc(ref, { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })
}

export function subscribeSavedMarks(uid, onChange) {
  const marksRef = collection(db, 'users', uid, 'marks')
  const marksQuery = query(marksRef, orderBy('createdAt', 'desc'))

  return onSnapshot(marksQuery, (snapshot) => {
    const items = snapshot.docs.map((docItem) => {
      const data = docItem.data()

      return {
        id: docItem.id,
        ...data,
        fecha:
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
      }
    })

    onChange(items)
  })
}

export function subscribeUserActivities(uid, onChange) {
  const activitiesRef = collection(db, 'users', uid, 'activities')

  return onSnapshot(activitiesRef, (snapshot) => {
    const activities = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    onChange(activities)
  })
}

export async function saveUserActivity(uid, activityId, activity) {
  const source = activity.source === 'strava' ? 'strava' : 'manual'
  const status = source === 'strava' && activity.status === 'importada'
    ? 'importada'
    : activity.status === 'no-realizada'
      ? 'no-realizada'
      : 'completada'
  await setDoc(doc(db, 'users', uid, 'activities', activityId), {
    sport: String(activity.sport ?? '').slice(0, 40),
    distance: String(activity.distance ?? '').slice(0, 20),
    duration: String(activity.duration ?? '').slice(0, 20),
    avgHr: String(activity.avgHr ?? '').slice(0, 20),
    rpe: String(activity.rpe ?? '').slice(0, 4),
    watts: String(activity.watts ?? '').slice(0, 20),
    day: String(activity.day ?? '').slice(0, 20),
    date: String(activity.date ?? '').slice(0, 10),
    status,
    notes: String(activity.notes ?? '').slice(0, 500),
    testId: String(activity.testId ?? '').slice(0, 40),
    source,
    planningMatchStatus: ['confirmed', 'rejected', 'unreviewed'].includes(activity.planningMatchStatus)
      ? activity.planningMatchStatus
      : '',
    matchedSessionDate: String(activity.matchedSessionDate ?? '').slice(0, 10),
    matchedSessionTitle: String(activity.matchedSessionTitle ?? '').slice(0, 120),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function deleteUserActivity(uid, activityId) {
  await deleteDoc(doc(db, 'users', uid, 'activities', activityId))
}

export function subscribeUserWellbeing(uid, onChange) {
  const wellbeingRef = collection(db, 'users', uid, 'wellbeing')

  return onSnapshot(wellbeingRef, (snapshot) => {
    const entries = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    onChange(entries)
  })
}

const SLEEP_QUALITIES = ['buena', 'regular', 'mala']

export async function saveUserWellbeing(uid, wellbeingId, wellbeing) {
  await setDoc(doc(db, 'users', uid, 'wellbeing', wellbeingId), {
    date: String(wellbeing.date ?? '').slice(0, 10),
    sleepHours: String(wellbeing.sleepHours ?? '').slice(0, 4),
    sleepQuality: SLEEP_QUALITIES.includes(wellbeing.sleepQuality) ? wellbeing.sleepQuality : '',
    fatigue: String(wellbeing.fatigue ?? '').slice(0, 4),
    soreness: String(wellbeing.soreness ?? '').slice(0, 4),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function saveUserProfile(uid, profile) {
  await setDoc(
    doc(db, 'users', uid),
    {
      nombre: profile.nombre ?? '',
      sexo: profile.sexo ?? '',
      cuerpoObjetivo: profile.cuerpoObjetivo ?? '',
      peso: profile.peso ?? '',
      altura: profile.altura ?? '',
      edad: profile.edad ?? '',
      fechaTipo: profile.fechaTipo ?? 'aproximada',
      fechaConcreta: profile.fechaConcreta ?? '',
      semanasAprox: profile.semanasAprox ?? '',
      objetivos: profile.objetivos ?? {},
      diasEntreno: profile.diasEntreno ?? [],
      duracionSesion: profile.duracionSesion ?? '60',
      experiencia: profile.experiencia ?? 'intermedio',
      objetivoEntreno: profile.objetivoEntreno ?? 'mejorar-nota',
      material: profile.material ?? {},
      lesiones: profile.lesiones ?? '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function addUserMark(uid, mark) {
  const created = await addDoc(collection(db, 'users', uid, 'marks'), {
    ...mark,
    createdAt: serverTimestamp(),
  })
  return created.id
}

// Los documentos públicos no contienen UID: se localizan por sourceMarkId,
// que es el ID aleatorio de la marca privada y no permite correlacionar marcas.
export async function deletePublicMarksBySource(sourceMarkId) {
  const snapshot = await getDocs(query(collection(db, 'publicMarks'), where('sourceMarkId', '==', sourceMarkId)))
  if (snapshot.empty) return
  const batch = writeBatch(db)
  snapshot.docs.forEach((docItem) => {
    batch.delete(docItem.ref)
  })
  await batch.commit()
}

export async function clearUserMarks(uid) {
  const marksRef = collection(db, 'users', uid, 'marks')
  const marksSnapshot = await getDocs(marksRef)

  if (marksSnapshot.empty) return

  const batch = writeBatch(db)
  marksSnapshot.docs.forEach((docItem) => {
    batch.delete(doc(marksRef, docItem.id))
  })
  await batch.commit()
  for (const docItem of marksSnapshot.docs) {
    await deletePublicMarksBySource(docItem.id)
  }
}

export async function deleteUserMark(uid, markId) {
  await deletePublicMarksBySource(markId)
  await deleteDoc(doc(db, 'users', uid, 'marks', markId))
}

// Lectura puntual del perfil (para migrar datos de sesión anónima al entrar con Google).
export async function getProfileOnce(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

// Lectura puntual de marcas (para migrar datos de sesión anónima al entrar con Google).
export async function getMarksOnce(uid) {
  const marksRef = collection(db, 'users', uid, 'marks')
  const marksSnapshot = await getDocs(query(marksRef, orderBy('createdAt', 'desc')))
  return marksSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
}

// Copia perfil (solo si la cuenta destino no tiene) y marcas a la cuenta destino.
// Se usa cuando el email de Google ya estaba registrado: la sesión anónima previa
// no se pierde, se traslada a la cuenta existente.
export async function migrateAnonymousData(anonProfile, anonMarks, targetUid) {
  let profileCopied = false
  let marksCopied = 0

  const targetProfile = await getProfileOnce(targetUid)
  if (anonProfile && !targetProfile) {
    // El email/rol/estado/plan y fechas son de la cuenta: no se migran, solo el perfil deportivo.
    const profileData = { ...anonProfile }
    delete profileData.email
    delete profileData.role
    delete profileData.status
    delete profileData.plan
    delete profileData.createdAt
    delete profileData.lastLoginAt
    await setDoc(doc(db, 'users', targetUid), { ...profileData, updatedAt: serverTimestamp() }, { merge: true })
    profileCopied = true
  }

  for (const mark of anonMarks) {
    const markData = { ...mark }
    delete markData.id
    const createdMark = await addDoc(collection(db, 'users', targetUid, 'marks'), { ...markData, migrated: true })
    if (markData.pruebaId && markData.pruebaNombre && markData.sexo && Number.isFinite(Number(markData.marcaNormalizada))) {
      await addDoc(collection(db, 'publicMarks'), {
        sourceMarkId: createdMark.id,
        testId: markData.pruebaId,
        testName: markData.pruebaNombre,
        sexo: markData.sexo,
        mark: Number(markData.marcaNormalizada),
        createdAt: serverTimestamp(),
      })
    }
    marksCopied += 1
  }

  return { profileCopied, marksCopied }
}

export function subscribeAllMarks(onChange) {
  const marksQuery = query(collectionGroup(db, 'marks'), orderBy('createdAt', 'desc'))

  return onSnapshot(marksQuery, (snapshot) => {
    const items = snapshot.docs.map((docItem) => {
      const data = docItem.data()
      const userId = docItem.ref.parent.parent?.id ?? ''

      return {
        id: docItem.id,
        userId,
        ...data,
        fecha:
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
      }
    })

    onChange(items)
  })
}

export async function deleteAdminMark(userId, markId) {
  await deleteUserMark(userId, markId)
}

export function subscribePublicRankings(onChange) {
  let publicMarks = []
  let legacyRankings = []

  const emit = () => {
    const grouped = publicMarks.reduce((acc, item) => {
      if (!item.testId || !item.sexo || !Number.isFinite(Number(item.mark))) return acc
      const key = `${item.testId}_${item.sexo}`
      if (!acc[key]) {
        acc[key] = {
          id: key,
          testId: item.testId,
          testName: item.testName,
          sexo: item.sexo,
          totalMarks: 0,
          sumMarks: 0,
        }
      }
      acc[key].totalMarks += 1
      acc[key].sumMarks += Number(item.mark)
      return acc
    }, {})

    const current = Object.values(grouped).map((item) => ({
      ...item,
      avgMark: item.sumMarks / item.totalMarks,
    }))
    const currentKeys = new Set(current.map((item) => item.id))
    const legacy = legacyRankings.filter((item) => !currentKeys.has(`${item.testId}_${item.sexo}`))
    onChange([...current, ...legacy].sort((a, b) => String(a.testName).localeCompare(String(b.testName))))
  }

  const unsubscribeMarks = onSnapshot(collection(db, 'publicMarks'), (snapshot) => {
    // Solo se conservan los campos agregables: nunca UID ni metadatos.
    publicMarks = snapshot.docs.map((item) => {
      const data = item.data()
      return { testId: data.testId, testName: data.testName, sexo: data.sexo, mark: data.mark }
    })
    emit()
  })
  const unsubscribeLegacy = onSnapshot(collection(db, 'publicRankings'), (snapshot) => {
    legacyRankings = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    emit()
  })

  return () => {
    unsubscribeMarks()
    unsubscribeLegacy()
  }
}

export async function registerPublicRankingMark({ markId, testId, testName, sexo, mark }) {
  await addDoc(collection(db, 'publicMarks'), {
    sourceMarkId: markId,
    testId,
    testName,
    sexo,
    mark: Number(mark),
    createdAt: serverTimestamp(),
  })
}
