import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  AuthVerifier,
  JournalStore,
  AiClient,
  VerifiedUser,
} from './contracts.js';
import {
  CreateJournalRequestSchema,
  ChatRequestSchema,
  ChatResponse,
  JournalDetailResponse,
  JournalExportResponse,
  UserMeResponse,
  PublicConfigResponse,
  ProvenanceItem,
} from '../shared/types.js';

export interface AppConfig {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseAppId?: string;
  disableRateLimit?: boolean;
}

export function createApp(dependencies: {
  authVerifier: AuthVerifier;
  journalStore: JournalStore;
  aiClient: AiClient;
  config?: AppConfig;
}) {
  const { authVerifier, journalStore, aiClient, config = {} } = dependencies;
  const app = express();

  // Disable x-powered-by
  app.disable('x-powered-by');

  // Trust reverse proxy (nginx / Cloud Run) for accurate IP resolution in express-rate-limit
  app.set('trust proxy', 1);

  // Security headers with Helmet configured for iframe preview compatibility
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com", "https://*.firebaseapp.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://*.googleusercontent.com", "https://*.gstatic.com", "https://www.gstatic.com"],
          connectSrc: [
            "'self'",
            "https://*.googleapis.com",
            "https://*.firebaseio.com",
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://*.firebaseapp.com",
          ],
          frameSrc: ["'self'", "https://*.firebaseapp.com", "https://accounts.google.com"],
          frameAncestors: ["'self'", "https://ai.studio", "https://*.google.com", "https://*.run.app", "*"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
      xContentTypeOptions: true,
      xDnsPrefetchControl: { allow: false },
      xFrameOptions: false,
      hsts: false,
    })
  );

  // Parse JSON with 32 KB body limit
  app.use(express.json({ limit: '32kb' }));

  // Global rate limiter
  if (!config.disableRateLimit) {
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      validate: { xForwardedForHeader: false },
      message: { error: 'Too many requests from this IP, please try again later.' },
    });
    app.use('/api', globalLimiter);
  }

  // Helper middleware for private cache-control headers on authenticated responses
  const setPrivateNoStoreHeaders = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Vary', 'Authorization');
    next();
  };

  // Auth Middleware
  interface AuthenticatedRequest extends Request {
    user: VerifiedUser;
  }

  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const user = await authVerifier.verifyToken(authHeader);
      (req as AuthenticatedRequest).user = user;
      next();
    } catch (err: any) {
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Vary', 'Authorization');
      res.status(err.statusCode || 401).json({
        error: err.message || 'Unauthorized: Missing or invalid token',
      });
    }
  };

  // ==========================================
  // PUBLIC ROUTES
  // ==========================================

  // 1. Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Public Firebase web configuration only
  app.get('/api/config', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const publicConfig: PublicConfigResponse = {
      firebase: {
        apiKey:
          config.firebaseApiKey ||
          process.env.FIREBASE_WEB_API_KEY ||
          process.env.FIREBASE_API_KEY ||
          process.env.VITE_FIREBASE_API_KEY ||
          '',
        authDomain: config.firebaseAuthDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: config.firebaseProjectId || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '',
        appId: config.firebaseAppId || process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
      },
    };
    res.status(200).json(publicConfig);
  });

  // ==========================================
  // AUTHENTICATED ROUTES
  // ==========================================

  // 3. User profile
  app.get('/api/me', requireAuth, setPrivateNoStoreHeaders, (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const response: UserMeResponse = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      authTime: user.authTime,
    };
    res.status(200).json(response);
  });

  // 4. List user journals
  app.get('/api/journals', requireAuth, setPrivateNoStoreHeaders, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const journals = await journalStore.listJournals(user.uid);
      res.status(200).json({ journals });
    } catch (error) {
      next(error);
    }
  });

  // 5. Create new journal
  app.post('/api/journals', requireAuth, setPrivateNoStoreHeaders, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const parsed = CreateJournalRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: parsed.error.issues,
        });
      }

      const journal = await journalStore.createJournal(user.uid, parsed.data.title);
      res.status(201).json({ journal });
    } catch (error) {
      next(error);
    }
  });

  // 6. Get journal detail (with messages latest-500)
  app.get('/api/journals/:id', requireAuth, setPrivateNoStoreHeaders, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const idParsed = z.string().uuid().safeParse(req.params.id);
      if (!idParsed.success) {
        return res.status(400).json({ error: 'Invalid journal ID format' });
      }
      const journalId = idParsed.data;

      const journal = await journalStore.getJournal(user.uid, journalId);
      if (!journal) {
        // Return 404 without revealing whether it belongs to another user
        return res.status(404).json({ error: 'Journal not found' });
      }

      const { messages, totalCount, hasOlder } = await journalStore.getJournalMessages(user.uid, journalId, 500);

      const response: JournalDetailResponse = {
        journal,
        messages,
        hasOlderMessages: hasOlder,
        totalMessages: totalCount,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // 7. Export journal (all messages in chronological order)
  app.get('/api/journals/:id/export', requireAuth, setPrivateNoStoreHeaders, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const idParsed = z.string().uuid().safeParse(req.params.id);
      if (!idParsed.success) {
        return res.status(400).json({ error: 'Invalid journal ID format' });
      }
      const journalId = idParsed.data;

      const journal = await journalStore.getJournal(user.uid, journalId);
      if (!journal) {
        return res.status(404).json({ error: 'Journal not found' });
      }

      const allMessages = await journalStore.getAllJournalMessages(user.uid, journalId);

      const response: JournalExportResponse = {
        exportedAt: new Date().toISOString(),
        journal,
        messages: allMessages,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  // 8. Delete journal (recursive)
  app.delete('/api/journals/:id', requireAuth, setPrivateNoStoreHeaders, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const idParsed = z.string().uuid().safeParse(req.params.id);
      if (!idParsed.success) {
        return res.status(400).json({ error: 'Invalid journal ID format' });
      }
      const journalId = idParsed.data;

      const existing = await journalStore.getJournal(user.uid, journalId);
      if (!existing) {
        return res.status(404).json({ error: 'Journal not found' });
      }

      await journalStore.deleteJournal(user.uid, journalId);
      res.status(200).json({ success: true, deletedId: journalId });
    } catch (error) {
      next(error);
    }
  });

  // Chat rate limiter
  if (!config.disableRateLimit) {
    const chatLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 turns per minute
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Chat rate limit exceeded. Please wait a moment before sending another message.' },
    });
    app.use('/api/chat', chatLimiter);
  }

  // 9a. Chat Status / Capabilities Probe
  app.get('/api/chat', setPrivateNoStoreHeaders, (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'Lighthouse Reflection & Socratic Prism Engine',
      method: 'POST required for interactive turns',
      operatingModes: ['persistent_vault', 'ephemeral_reflection'],
      supportedPrisms: ['socratic', 'grounding', 'devils_advocate', 'perspective_shift'],
    });
  });

  // 9b. Chat Turn
  app.post('/api/chat', requireAuth, setPrivateNoStoreHeaders, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;

      const parsed = ChatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: parsed.error.issues,
        });
      }

      const {
        journalId,
        turnId,
        message: userMessageText,
        prismMode,
        memoryScope,
        selectedJournalIds,
        ephemeralHistory,
      } = parsed.data;

      // =========================================================================
      // PERSISTENT JOURNAL TURN
      // =========================================================================
      if (journalId) {
        // Step 1 & 2: Load journal under users/{verifiedUid}
        const journal = await journalStore.getJournal(user.uid, journalId);
        if (!journal) {
          return res.status(404).json({ error: 'Journal not found' });
        }

        // Step 4 & 5: Directly lookup deterministic {turnId}-user and {turnId}-model documents
        const existingTurn = await journalStore.lookupTurn(user.uid, journalId, turnId);
        if (existingTurn) {
          // If already committed with the exact same user text, return stored result (Idempotent retry)
          if (existingTurn.userMessage.text === userMessageText) {
            const response: ChatResponse = {
              reply: existingTurn.modelMessage.text,
              provenance: existingTurn.modelMessage.provenance || [],
              persisted: true,
              summary: journal.summary,
              turnId,
              userMessage: existingTurn.userMessage,
              modelMessage: existingTurn.modelMessage,
            };
            return res.status(200).json(response);
          } else {
            // Step 6: Same turnId used for different text -> 409 Conflict
            return res.status(409).json({
              error: 'Conflict: turnId has already been used with different message content.',
            });
          }
        }

        // Step 7: Build bounded current conversation history (latest 20 items)
        const allMessages = await journalStore.getAllJournalMessages(user.uid, journalId);
        const boundedHistory = allMessages.slice(-20);
        const historyMessageIds = new Set(allMessages.map((m) => m.id));

        // Step 8: Build receipt items for current conversation items
        const provenanceReceipt: ProvenanceItem[] = boundedHistory.map((m) => ({
          journalId: journal.id,
          journalTitle: journal.title,
          messageId: m.id,
          role: m.role,
          sourceKind: 'conversation',
          createdAt: m.createdAt,
          excerpt: m.text.slice(0, 500),
        }));

        // Step 9: Resolve additional Memory Lens entries below verified UID (excluding current history)
        const addedMemories = await journalStore.resolveMemoryEntries(
          user.uid,
          journal.id,
          memoryScope,
          selectedJournalIds,
          historyMessageIds
        );

        for (const mem of addedMemories) {
          provenanceReceipt.push({
            journalId: mem.journalId,
            journalTitle: mem.journalTitle,
            messageId: mem.messageId,
            role: mem.role,
            sourceKind: 'memory',
            createdAt: mem.createdAt,
            excerpt: mem.excerpt,
          });
        }

        // Step 10: Call Gemini for the reply
        const modelReply = await aiClient.generateReply({
          currentHistory: boundedHistory.map((h) => ({ role: h.role, text: h.text, messageId: h.id })),
          userMessage: userMessageText,
          memoryExcerpts: addedMemories,
          prismMode,
        });

        // Step 11: Call Gemini for structured JSON summary
        const expectedMessageCount = journal.messageCount;
        const newThroughCount = expectedMessageCount + 2;

        const recentTurnsForSummary = boundedHistory.slice(-10).map((h) => ({
          role: h.role,
          text: h.text,
        }));

        const newSummary = await aiClient.generateSummary({
          previousSummary: journal.summary,
          recentTurns: recentTurnsForSummary,
          newTurn: {
            userText: userMessageText,
            modelReply,
          },
          throughMessageCount: newThroughCount,
        });

        // Step 13: In one atomic transaction, commit user msg, model msg with provenance, summary, and count
        const commitResult = await journalStore.commitTurnTransaction(
          user.uid,
          journal.id,
          expectedMessageCount,
          turnId,
          userMessageText,
          modelReply,
          provenanceReceipt,
          newSummary
        );

        const response: ChatResponse = {
          reply: modelReply,
          provenance: provenanceReceipt,
          persisted: true,
          summary: commitResult.journal.summary,
          turnId,
          userMessage: commitResult.userMessage,
          modelMessage: commitResult.modelMessage,
        };

        return res.status(200).json(response);
      }

      // =========================================================================
      // EPHEMERAL REFLECTION TURN
      // =========================================================================
      const history = ephemeralHistory || [];
      const boundedEphemeralHistory = history.slice(-20);

      // Build conversation provenance for ephemeral tab history
      const provenanceReceipt: ProvenanceItem[] = boundedEphemeralHistory.map((m, idx) => ({
        journalId: 'ephemeral',
        journalTitle: 'Ephemeral Reflection',
        messageId: `ephemeral-${idx}`,
        role: m.role,
        sourceKind: 'conversation',
        createdAt: m.createdAt,
        excerpt: m.text.slice(0, 500),
      }));

      // Resolve memory if selected (e.g. selected_journals or recent_journals)
      const addedMemories = await journalStore.resolveMemoryEntries(
        user.uid,
        undefined,
        memoryScope,
        selectedJournalIds,
        new Set()
      );

      for (const mem of addedMemories) {
        provenanceReceipt.push({
          journalId: mem.journalId,
          journalTitle: mem.journalTitle,
          messageId: mem.messageId,
          role: mem.role,
          sourceKind: 'memory',
          createdAt: mem.createdAt,
          excerpt: mem.excerpt,
        });
      }

      // Generate reply only (never summarize, never commit to store)
      const modelReply = await aiClient.generateReply({
        currentHistory: boundedEphemeralHistory.map((h, idx) => ({
          role: h.role,
          text: h.text,
          messageId: `ephemeral-${idx}`,
        })),
        userMessage: userMessageText,
        memoryExcerpts: addedMemories,
        prismMode,
      });

      const response: ChatResponse = {
        reply: modelReply,
        provenance: provenanceReceipt,
        persisted: false,
        summary: null,
        turnId,
      };

      return res.status(200).json(response);
    } catch (error: any) {
      if (error.statusCode === 409 || error.code === 'CONFLICT') {
        return res.status(409).json({
          error: 'Conflict: Concurrent turn update detected. Please retry.',
        });
      }
      next(error);
    }
  });

  // Global Error Handler (Sanitized without leaking internal stack traces or secrets)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Set private no-store headers on errors
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Vary', 'Authorization');

    res.status(status).json({
      error: status === 500 ? 'An unexpected error occurred. Please try again.' : message,
    });
  });

  return app;
}
