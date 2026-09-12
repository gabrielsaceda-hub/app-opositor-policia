import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDfElAMLMILaUnIZpCYSWpokSzyAo9F6iQ',
  authDomain: 'calculadora-a7ef6.firebaseapp.com',
  projectId: 'calculadora-a7ef6',
  storageBucket: 'calculadora-a7ef6.firebasestorage.app',
  messagingSenderId: '223097636046',
  appId: '1:223097636046:web:c9e01b165cdb6d923f7c9f',
  measurementId: 'G-Q5Z3LVTX2X',
}

const app = initializeApp(firebaseConfig)
const analyticsPromise = typeof window === 'undefined' ? Promise.resolve(null) : isSupported().then((ok) => (ok ? getAnalytics(app) : null))

export const auth = getAuth(app)
export const db = getFirestore(app)

export async function logAnalyticsEvent(eventName, params = {}) {
  const analytics = await analyticsPromise
  if (!analytics) return
  logEvent(analytics, eventName, params)
}
