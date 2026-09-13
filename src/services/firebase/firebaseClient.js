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
let analyticsPromise = null

function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('cookie-consent-v1') === 'accepted'
  } catch {
    return false
  }
}

export const auth = getAuth(app)
export const db = getFirestore(app)

export async function logAnalyticsEvent(eventName, params = {}) {
  if (!hasAnalyticsConsent()) return
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((ok) => (ok ? getAnalytics(app) : null))
  }
  const analytics = await analyticsPromise
  if (!analytics) return
  logEvent(analytics, eventName, params)
}
