import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
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
