import path from 'path';
import fs from 'fs';
import express from 'express';
import { createApp } from './server/app.js';
import { FirebaseAuthVerifier, FakeAuthVerifier } from './server/auth.js';
import { FirestoreJournalStore } from './server/firestoreStore.js';
import { InMemoryJournalStore } from './server/memoryStore.js';
import { ResilientJournalStore } from './server/resilientStore.js';
import { GeminiAiClient, FakeAiClient, ResilientAiClient } from './server/gemini.js';
import { initFirebaseAdmin } from './server/firebase.js';

const rootDir = process.cwd();

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const defaultPort = 3000;
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
  const targetPort = isProd ? (envPort || defaultPort) : defaultPort;

  // Initialize Firebase Admin if possible
  const { db } = initFirebaseAdmin();

  // Pick store & verifier with resilient fallback
  const firestoreStore = db ? new FirestoreJournalStore(db) : null;
  const journalStore = new ResilientJournalStore(firestoreStore);
  const authVerifier = new FirebaseAuthVerifier();
  const aiClient = new ResilientAiClient();

  // Load firebase-applet-config.json if available
  let fbConfig: Record<string, string> = {};
  try {
    const configPath = path.join(rootDir, 'firebase-applet-config.json');
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
      firebaseApiKey:
        process.env.FIREBASE_WEB_API_KEY ||
        process.env.FIREBASE_API_KEY ||
        process.env.VITE_FIREBASE_API_KEY ||
        fbConfig.apiKey,
      firebaseAuthDomain:
        process.env.FIREBASE_AUTH_DOMAIN ||
        process.env.VITE_FIREBASE_AUTH_DOMAIN ||
        fbConfig.authDomain,
      firebaseProjectId:
        process.env.FIREBASE_PROJECT_ID ||
        process.env.VITE_FIREBASE_PROJECT_ID ||
        fbConfig.projectId ||
        process.env.GOOGLE_CLOUD_PROJECT,
      firebaseAppId:
        process.env.FIREBASE_APP_ID ||
        process.env.VITE_FIREBASE_APP_ID ||
        fbConfig.appId,
    },
  });

  // Strict API 404 handler - prevents /api/* requests from falling through to HTML index
  app.all('/api/*', (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Vary', 'Authorization');
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Mount Vite or static file handler
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: rootDir,
      server: {
        middlewareMode: true,
        hmr: false,
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

  const server = app.listen(targetPort, '0.0.0.0', () => {
    console.log(`Lighthouse server running on port ${targetPort} (${isProd ? 'production' : 'development'})`);
  });

  // Handle graceful termination in Cloud Run
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server gracefully');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
      process.exit(0);
    });
  });
}


startServer().catch((err) => {
  console.error('Fatal startup error:', err.message);
  process.exit(1);
});
