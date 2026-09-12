import { initializeApp } from 'firebase/app'
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

export const auth = getAuth(app)
export const db = getFirestore(app)
