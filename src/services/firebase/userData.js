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
    email: isAnonymous ? '' : email,
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
        transaction.set(ref, patch, { merge: true })
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
  await addDoc(collection(db, 'users', uid, 'marks'), {
    ...mark,
    createdAt: serverTimestamp(),
  })
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
}

export async function deleteUserMark(uid, markId) {
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
    await addDoc(collection(db, 'users', targetUid, 'marks'), { ...markData, migrated: true })
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
  const rankingsRef = collection(db, 'publicRankings')
  const rankingsQuery = query(rankingsRef, orderBy('testName', 'asc'))

  return onSnapshot(rankingsQuery, (snapshot) => {
    const items = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }))

    onChange(items)
  })
}

export async function registerPublicRankingMark({ testId, testName, sexo, mark }) {
  const rankingId = `${testId}_${sexo}`
  const rankingRef = doc(db, 'publicRankings', rankingId)

  await runTransaction(db, async (transaction) => {
    const rankingSnap = await transaction.get(rankingRef)
    const current = rankingSnap.exists()
      ? rankingSnap.data()
      : {
          totalMarks: 0,
          sumMarks: 0,
          avgMark: 0,
        }

    const totalMarks = Number(current.totalMarks ?? 0) + 1
    const sumMarks = Number(current.sumMarks ?? 0) + Number(mark)

    transaction.set(
      rankingRef,
      {
        testId,
        testName,
        sexo,
        totalMarks,
        sumMarks,
        avgMark: sumMarks / totalMarks,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  })
}
