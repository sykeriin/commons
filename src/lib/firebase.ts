import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

const cfg = firebaseConfig as Record<string, string>;
const isPlaceholder = (v?: string) => !v || v.startsWith('YOUR_');

/** False until a real Firebase web config is placed in firebase-applet-config.json. The app then runs in demo mode only. */
export const firebaseEnabled = !isPlaceholder(cfg.projectId) && !isPlaceholder(cfg.apiKey) && !isPlaceholder(cfg.appId);

let _auth: Auth | null = null; let _db: Firestore | null = null;
if (firebaseEnabled) {
  const app = initializeApp(cfg);
  _auth = getAuth(app);
  _db = isPlaceholder(cfg.firestoreDatabaseId) || cfg.firestoreDatabaseId === '(default)' ? getFirestore(app) : getFirestore(app, cfg.firestoreDatabaseId);
}
export const auth = _auth; export const db = _db;

export async function signIn() {
  if (!_auth) throw new Error('Firebase is not configured');
  try { return (await signInWithPopup(_auth, new GoogleAuthProvider())).user; }
  catch (e: any) { if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return null; throw e; }
}
export async function logout() { if (_auth) await signOut(_auth); }
