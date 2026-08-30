import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let adminApp: App | null = null;
let firestoreDb: Firestore | null = null;

export function initFirebaseAdmin(): { app: App | null; db: Firestore | null } {
  let configProjectId: string | undefined;
  let fallbackDatabaseId: string | undefined = undefined;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.projectId) configProjectId = parsed.projectId;
      if (parsed.firestoreDatabaseId) fallbackDatabaseId = parsed.firestoreDatabaseId;
    }
  } catch {
    // Ignore
  }

  const databaseId =
    process.env.FIRESTORE_DATABASE_ID ||
    fallbackDatabaseId;

  // IMPORTANT: Prioritize configProjectId / FIREBASE_PROJECT_ID before host GOOGLE_CLOUD_PROJECT
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    configProjectId ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    'demo-lighthouse';

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    try {
      firestoreDb = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
    } catch {
      firestoreDb = null;
    }
    return { app: adminApp, db: firestoreDb };
  }

  try {
    adminApp = initializeApp({
      projectId,
    });
    try {
      firestoreDb = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
    } catch {
      firestoreDb = null;
    }
    return { app: adminApp, db: firestoreDb };
  } catch (error) {
    // If not in GCP or no ADC, log minimal operational error
    return { app: null, db: null };
  }
}

