import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  connectAuthEmulator,
  Auth,
} from 'firebase/auth';
import firebaseConfigFallback from '../firebase-applet-config.json';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let initPromise: Promise<{ app: FirebaseApp; auth: Auth }> | null = null;

/**
 * Dynamically fetches Firebase configuration from the backend /api/config endpoint
 * to ensure credentials are always up-to-date and not reliant on missing client-side env vars.
 */
async function fetchFirebaseConfig(): Promise<FirebaseConfig> {
  // Start with default fallback values
  let apiKey = (firebaseConfigFallback.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
  let authDomain = (firebaseConfigFallback.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
  let projectId = (firebaseConfigFallback.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  let appId = (firebaseConfigFallback.appId || import.meta.env.VITE_FIREBASE_APP_ID || '').trim();

  try {
    const res = await fetch('/api/config', {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.firebase) {
        if (data.firebase.apiKey) apiKey = data.firebase.apiKey.trim();
        if (data.firebase.authDomain) authDomain = data.firebase.authDomain.trim();
        if (data.firebase.projectId) projectId = data.firebase.projectId.trim();
        if (data.firebase.appId) appId = data.firebase.appId.trim();
      }
    } else {
      console.warn(`[Firebase] /api/config returned status ${res.status}, falling back to static config.`);
    }
  } catch (error) {
    console.warn('[Firebase] Failed to fetch dynamic config from /api/config, falling back to static config:', error);
  }

  return { apiKey, authDomain, projectId, appId };
}

async function doInitializeFirebase(): Promise<{ app: FirebaseApp; auth: Auth }> {
  if (app && auth) {
    return { app, auth };
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    auth = getAuth(app);
    return { app, auth };
  }

  // Retrieve dynamic configuration from backend
  const config = await fetchFirebaseConfig();

  app = initializeApp(config);
  auth = getAuth(app);

  if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  }

  return { app, auth };
}

export function getFirebaseClient(): Promise<{ app: FirebaseApp; auth: Auth }> {
  if (app && auth) {
    return Promise.resolve({ app, auth });
  }

  if (!initPromise) {
    initPromise = doInitializeFirebase().catch((err) => {
      initPromise = null;
      throw err;
    });
  }

  return initPromise;
}

export async function signInWithGoogle(): Promise<User> {
  const { auth } = await getFirebaseClient();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOut(): Promise<void> {
  const { auth } = await getFirebaseClient();
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  let unsubscribe: (() => void) | null = null;
  let isCancelled = false;

  getFirebaseClient()
    .then(({ auth }) => {
      if (isCancelled) return;
      unsubscribe = onAuthStateChanged(auth, callback, (error) => {
        console.error('[Firebase Auth] Auth state change error:', error);
        callback(null);
      });
    })
    .catch((error) => {
      console.error('[Firebase Auth] Initialization failed during subscribe:', error);
      if (!isCancelled) {
        callback(null);
      }
    });

  return () => {
    isCancelled = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
