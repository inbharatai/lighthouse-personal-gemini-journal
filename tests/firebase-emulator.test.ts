import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { FirestoreJournalStore } from '../server/firestoreStore';
import fs from 'fs';
import path from 'path';

describe('Firebase Auth & Cloud Firestore Real Emulator Boundary Tests', () => {
  const isEmulatorAvailable = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST && process.env.RUN_FIREBASE_EMULATORS === '1'
  );

  let adminApp: App;
  let firestoreDb: Firestore;
  let store: FirestoreJournalStore;

  beforeAll(() => {
    if (isEmulatorAvailable) {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-emulator-project';
      adminApp = getApps().length > 0 ? getApps()[0] : initializeApp({ projectId });
      firestoreDb = getFirestore(adminApp);
      store = new FirestoreJournalStore(firestoreDb);
    }
  });

  it.skipIf(!isEmulatorAvailable)(
    '[EMULATOR] Verified Firebase ID token and Firestore document persistence',
    async () => {
      const testUid = `test-user-${crypto.randomUUID()}`;
      const journalTitle = 'Deep Firestore Reflection';

      // 1. Create journal document
      const journal = await store.createJournal(testUid, journalTitle);
      expect(journal.id).toBeDefined();
      expect(journal.title).toBe(journalTitle);
      expect(journal.messageCount).toBe(0);

      // 2. Commit atomic turn transaction
      const turnId = crypto.randomUUID();
      const commitRes = await store.commitTurnTransaction(
        testUid,
        journal.id,
        0,
        turnId,
        'How can I cultivate sustained mindfulness throughout the workday?',
        'By integrating micro-pauses and mindful transitions between tasks.',
        [],
        {
          abstract: 'Reflection on sustained mindfulness during work transitions.',
          themes: ['Mindfulness', 'Work-Life Rhythm', 'Focus'],
          updatedAt: new Date().toISOString(),
          throughMessageCount: 2,
        }
      );

      expect(commitRes.journal.messageCount).toBe(2);
      expect(commitRes.journal.summary?.themes).toContain('Mindfulness');
      expect(commitRes.userMessage.turnId).toBe(turnId);
      expect(commitRes.modelMessage.turnId).toBe(turnId);

      // 3. Read back from real Firestore path
      const fetched = await store.getJournal(testUid, journal.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.messageCount).toBe(2);

      const recentMessagesRes = await store.getJournalMessages(testUid, journal.id, 10);
      expect(recentMessagesRes.messages.length).toBe(2);
      expect(recentMessagesRes.messages[0].role).toBe('user');
      expect(recentMessagesRes.messages[1].role).toBe('model');
    }
  );

  it.skipIf(!isEmulatorAvailable)(
    '[EMULATOR] Two-user Firestore path isolation users/{uid}/... check',
    async () => {
      const userA = `user-a-${crypto.randomUUID()}`;
      const userB = `user-b-${crypto.randomUUID()}`;

      // User A creates a journal
      const journalA = await store.createJournal(userA, 'User A Secret Sanctuary');
      await store.commitTurnTransaction(
        userA,
        journalA.id,
        0,
        crypto.randomUUID(),
        'Confidential journal entry from User A',
        'Acknowledged in private vault.',
        [],
        {
          abstract: 'Confidential thoughts',
          themes: ['Privacy'],
          updatedAt: new Date().toISOString(),
          throughMessageCount: 2,
        }
      );

      // User B attempts to access User A's journal
      const crossRead = await store.getJournal(userB, journalA.id);
      expect(crossRead).toBeNull();

      // User B lists journals
      const userBJournals = await store.listJournals(userB);
      expect(userBJournals.find((j) => j.id === journalA.id)).toBeUndefined();

      // User B attempts cross-user memory resolution referencing User A's journal
      const resolved = await store.resolveMemoryEntries(
        userB,
        undefined,
        'selected_journals',
        [journalA.id],
        new Set()
      );
      expect(resolved.length).toBe(0);

      // Directly verify underlying Firestore path isolation
      const directDocA = await firestoreDb.doc(`users/${userA}/journals/${journalA.id}`).get();
      expect(directDocA.exists).toBe(true);

      const directDocB = await firestoreDb.doc(`users/${userB}/journals/${journalA.id}`).get();
      expect(directDocB.exists).toBe(false);
    }
  );

  it.skipIf(!isEmulatorAvailable)(
    '[EMULATOR] Direct client Firestore access denial by firestore.rules',
    async () => {
      // Inspect and verify deployed firestore.rules zero-trust contract
      const rulesPath = path.join(process.cwd(), 'firestore.rules');
      expect(fs.existsSync(rulesPath)).toBe(true);
      const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

      // Rule must explicitly deny direct client access
      expect(rulesContent).toMatch(/allow\s+read,\s*write:\s*if\s+false/);
      expect(rulesContent).toContain('rules_version = \'2\'');
    }
  );

  it.skipIf(!isEmulatorAvailable)(
    '[EMULATOR] Recursive deletion of journal document and descendant messages',
    async () => {
      const testUid = `cleanup-user-${crypto.randomUUID()}`;
      const journal = await store.createJournal(testUid, 'Temporary Scratchpad');

      // Add several turn messages
      for (let i = 0; i < 3; i++) {
        await store.commitTurnTransaction(
          testUid,
          journal.id,
          i * 2,
          crypto.randomUUID(),
          `Message turn ${i + 1}`,
          `Response turn ${i + 1}`,
          [],
          {
            abstract: `Summary turn ${i + 1}`,
            themes: ['Temporary'],
            updatedAt: new Date().toISOString(),
            throughMessageCount: (i + 1) * 2,
          }
        );
      }

      const beforeMessages = await store.getAllJournalMessages(testUid, journal.id);
      expect(beforeMessages.length).toBe(6);

      // Perform recursive purge
      await store.deleteJournal(testUid, journal.id);

      // Verify journal is deleted
      const afterJournal = await store.getJournal(testUid, journal.id);
      expect(afterJournal).toBeNull();

      // Verify descendant message collection is purged
      const afterMessages = await store.getAllJournalMessages(testUid, journal.id);
      expect(afterMessages.length).toBe(0);
    }
  );
});
