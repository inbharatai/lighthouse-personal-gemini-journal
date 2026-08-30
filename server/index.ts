import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './app.js';
import { FirebaseAuthVerifier, FakeAuthVerifier } from './auth.js';
import { FirestoreJournalStore } from './firestoreStore.js';
import { InMemoryJournalStore } from './memoryStore.js';
import { GeminiAiClient, FakeAiClient } from './gemini.js';
import { initFirebaseAdmin } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Firebase Admin if possible
  const { db } = initFirebaseAdmin();

  // Pick store
  let journalStore;
  let authVerifier;
  let aiClient;

  if (db && process.env.NODE_ENV === 'production') {
    journalStore = new FirestoreJournalStore(db);
    authVerifier = new FirebaseAuthVerifier();
  } else if (process.env.FIRESTORE_EMULATOR_HOST && db) {
    journalStore = new FirestoreJournalStore(db);
    authVerifier = new FirebaseAuthVerifier();
  } else {
    // In local dev without credentials, use in-memory store and Firebase Auth or dev verifier
    journalStore = new InMemoryJournalStore();
    authVerifier = new FirebaseAuthVerifier();
  }

  // Pick AI Client
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GeminiAiClient();
  } else {
    // Graceful fallback for local development before key is configured
    aiClient = new GeminiAiClient();
  }

  // Load firebase-applet-config.json if available
  let fbConfig: Record<string, string> = {};
  try {
    const configPath = path.join(rootDir, 'firebase-applet-config.json');
    const fs = await import('fs');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      fbConfig = JSON.parse(raw);
    }
  } catch {
    // Ignore if not present
  }

  const app = createApp({
    authVerifier,
    journalStore,
    aiClient,
    config: {
      firebaseApiKey: process.env.VITE_FIREBASE_API_KEY || fbConfig.apiKey,
      firebaseAuthDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || fbConfig.authDomain,
      firebaseProjectId: process.env.VITE_FIREBASE_PROJECT_ID || fbConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT,
      firebaseAppId: process.env.VITE_FIREBASE_APP_ID || fbConfig.appId,
    },
  });

  // Mount Vite or static file handler
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: rootDir,
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(rootDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lighthouse server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err.message);
  process.exit(1);
});
