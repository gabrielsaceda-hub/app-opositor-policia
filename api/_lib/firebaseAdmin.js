import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getServiceAccount() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (!encoded) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_BASE64')
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
}

export function getAdminApp() {
  const existing = getApps()[0]
  if (existing) return existing
  return initializeApp({ credential: cert(getServiceAccount()) })
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}

export function getAdminDb() {
  return getFirestore(getAdminApp())
}
