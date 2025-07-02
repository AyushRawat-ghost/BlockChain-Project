// src/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth }    from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBFTBjHUsnr-FXn6ObX7LaPV3e8UNhxDFM",
  authDomain: "real-estate-94f69.firebaseapp.com",
  projectId: "real-estate-94f69",
  storageBucket: "real-estate-94f69.appspot.com",
  messagingSenderId: "502462149190",
  appId: "1:502462149190:web:88972ff1e5067ab4f19047",
  measurementId: "G-87BNBJ7T5P"
}

// Initialize Firebase app once
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp()

// Auth instance (optional)
export const auth = getAuth(app)

// Firestore instance
export const db = getFirestore(app)

// Storage instance—make sure to export this!
export const storage = getStorage(app)