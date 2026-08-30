import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { FakeAuthVerifier } from '../server/auth.js';
import { InMemoryJournalStore } from '../server/memoryStore.js';
import { FakeAiClient } from '../server/gemini.js';
import { VerifiedUser } from '../server/contracts.js';

describe('Lighthouse API & Security Constitution Test Suite', () => {
  let authVerifier: FakeAuthVerifier;
  let journalStore: InMemoryJournalStore;
  let aiClient: FakeAiClient;
  let app: any;

  const userA: VerifiedUser = {
    uid: 'user-a-111',
    email: 'userA@example.com',
    displayName: 'Alice User',
    photoURL: 'https://example.com/alice.png',
    authTime: new Date().toISOString(),
  };

  const userB: VerifiedUser = {
    uid: 'user-b-222',
    email: 'userB@example.com',
    displayName: 'Bob Attacker',
    photoURL: 'https://example.com/bob.png',
    authTime: new Date().toISOString(),
  };

  const tokenA = 'valid-token-user-a';
  const tokenB = 'valid-token-user-b';

  beforeEach(() => {
    authVerifier = new FakeAuthVerifier();
    authVerifier.registerUser(tokenA, userA);
    authVerifier.registerUser(tokenB, userB);

    journalStore = new InMemoryJournalStore();
    aiClient = new FakeAiClient();

    app = createApp({
      authVerifier,
      journalStore,
      aiClient,
      config: {
        disableRateLimit: true,
        firebaseApiKey: 'public-key-123',
        firebaseAuthDomain: 'test.firebaseapp.com',
        firebaseProjectId: 'test-project',
        firebaseAppId: '1:123:web:abc',
      },
    });
  });

  // 1. Missing token rejected
  it('1. Missing token rejected with 401 and private no-store headers', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
    expect(res.headers['cache-control']).toBe('private, no-store');
  });

  // 2. Invalid token rejected
  it('2. Invalid token rejected with 401', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer invalid-token-xyz');
    expect(res.status).toBe(401);
  });

  // 3. User B cannot get User A journal (404 isolation)
  it('3. User B cannot get User A journal and receives 404', async () => {
    const journalA = await journalStore.createJournal(userA.uid, 'Alice Private Thoughts');

    const res = await request(app)
      .get(`/api/journals/${journalA.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  // 4. User B cannot delete User A journal
  it('4. User B cannot delete User A journal and receives 404', async () => {
    const journalA = await journalStore.createJournal(userA.uid, 'Alice Journal to Keep');

    const res = await request(app)
      .delete(`/api/journals/${journalA.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    // Verify journal A is still intact in store
    const check = await journalStore.getJournal(userA.uid, journalA.id);
    expect(check).not.toBeNull();
  });

  // 5. User B cannot export User A journal
  it('5. User B cannot export User A journal and receives 404', async () => {
    const journalA = await journalStore.createJournal(userA.uid, 'Alice Journal for Export');

    const res = await request(app)
      .get(`/api/journals/${journalA.id}/export`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  // 6. User B cannot append chat to User A journal
  it('6. User B cannot append chat to User A journal and receives 404', async () => {
    const journalA = await journalStore.createJournal(userA.uid, 'Alice Chat Journal');

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        journalId: journalA.id,
        turnId: crypto.randomUUID(),
        message: 'Intrusion attempt text',
        memoryScope: 'none',
      });

    expect(res.status).toBe(404);
  });

  // 7. Foreign selected-memory ID is ignored
  it('7. Foreign selected-memory ID is ignored during memory resolution', async () => {
    const journalA = await journalStore.createJournal(userA.uid, 'Alice Active Journal');
    const journalB = await journalStore.createJournal(userB.uid, 'Bob Secret Journal');

    // Bob writes a message in his journal
    await journalStore.commitTurnTransaction(
      userB.uid,
      journalB.id,
      0,
      crypto.randomUUID(),
      'Bob secret password in journal',
      'Bob model reply',
      [],
      {
        abstract: 'Bob secret',
        themes: ['Secrets'],
        updatedAt: new Date().toISOString(),
        throughMessageCount: 2,
      }
    );

    // Alice attempts to select Bob's journal ID in Memory Lens
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journalA.id,
        turnId: crypto.randomUUID(),
        message: 'Alice reflection with cross memory',
        memoryScope: 'selected_journals',
        selectedJournalIds: [journalB.id],
      });

    expect(res.status).toBe(200);
    // Verify Bob's secret was NOT included in Alice's receipt or AI arguments
    const receipt = res.body.provenance as any[];
    const bobExcerpts = receipt.filter((r) => r.journalId === journalB.id);
    expect(bobExcerpts.length).toBe(0);
  });

  // 8. Persistent turn stores exactly user plus model message
  it('8. Persistent turn stores exactly user plus model message', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Daily Reflections');
    const turnId = crypto.randomUUID();

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId,
        message: 'Today was productive and clear.',
        memoryScope: 'none',
      });

    expect(res.status).toBe(200);
    expect(res.body.persisted).toBe(true);

    const msgs = await journalStore.getAllJournalMessages(userA.uid, journal.id);
    expect(msgs.length).toBe(2);
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].text).toBe('Today was productive and clear.');
    expect(msgs[1].role).toBe('model');
  });

  // 9. Persistent turn stores automatic summary and themes
  it('9. Persistent turn stores automatic summary and themes', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Summary Test Journal');
    const turnId = crypto.randomUUID();

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId,
        message: 'Reflecting on project milestones.',
        memoryScope: 'none',
      });

    expect(res.status).toBe(200);
    expect(res.body.summary).not.toBeNull();
    expect(res.body.summary.abstract).toBeDefined();
    expect(Array.isArray(res.body.summary.themes)).toBe(true);

    const updatedJournal = await journalStore.getJournal(userA.uid, journal.id);
    expect(updatedJournal?.summary?.throughMessageCount).toBe(2);
  });

  // 10. Ephemeral mode writes nothing and returns summary null
  it('10. Ephemeral mode writes nothing to store and returns summary null', async () => {
    const turnId = crypto.randomUUID();

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        turnId,
        message: 'Transient ephemeral thought',
        memoryScope: 'none',
      });

    expect(res.status).toBe(200);
    expect(res.body.persisted).toBe(false);
    expect(res.body.summary).toBeNull();

    // Verify 0 journals created
    const list = await journalStore.listJournals(userA.uid);
    expect(list.length).toBe(0);
  });

  // 11. Summary failure returns error and stores neither message nor summary
  it('11. Summary failure returns error and stores neither message nor summary', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Fail Closed Test');
    aiClient.shouldFailSummary = true;

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId: crypto.randomUUID(),
        message: 'Turn where summary fails',
        memoryScope: 'none',
      });

    expect(res.status).toBe(500);

    // Verify zero messages and unchanged summary in store
    const msgs = await journalStore.getAllJournalMessages(userA.uid, journal.id);
    expect(msgs.length).toBe(0);
    const updatedJournal = await journalStore.getJournal(userA.uid, journal.id);
    expect(updatedJournal?.summary).toBeNull();
    expect(updatedJournal?.messageCount).toBe(0);
  });

  // 12. Same turnId retry returns stored result and causes one reply call and one summary call
  it('12. Same turnId retry returns stored result without re-executing AI calls', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Idempotency Journal');
    const turnId = crypto.randomUUID();
    const message = 'Idempotent request text';

    // First call
    const res1 = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId,
        message,
        memoryScope: 'none',
      });
    expect(res1.status).toBe(200);

    // Reset spy call tracking
    aiClient.lastGenerateReplyArgs = null;
    aiClient.lastGenerateSummaryArgs = null;

    // Retry with same turnId & message
    const res2 = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId,
        message,
        memoryScope: 'none',
      });

    expect(res2.status).toBe(200);
    expect(res2.body.reply).toBe(res1.body.reply);
    // Verify AI client was NOT called again
    expect(aiClient.lastGenerateReplyArgs).toBeNull();
    expect(aiClient.lastGenerateSummaryArgs).toBeNull();
  });

  // 13. Same turnId with changed content returns 409
  it('13. Same turnId with changed content returns 409 Conflict', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Conflict Journal');
    const turnId = crypto.randomUUID();

    // First call
    await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId,
        message: 'Original message',
        memoryScope: 'none',
      });

    // Second call with different text
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId,
        message: 'Altered conflicting message',
        memoryScope: 'none',
      });

    expect(res.status).toBe(409);
  });

  // 14. Stale concurrent summary commit returns 409 and does not overwrite newer state
  it('14. Stale concurrent summary commit returns 409', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Concurrency Test');

    // Simulate concurrent update on store
    await journalStore.commitTurnTransaction(
      userA.uid,
      journal.id,
      0,
      crypto.randomUUID(),
      'Concurrent message',
      'Concurrent reply',
      [],
      {
        abstract: 'New state',
        themes: ['Concurrency'],
        updatedAt: new Date().toISOString(),
        throughMessageCount: 2,
      }
    );

    // Attempting to commit with expectedMessageCount 0 now fails with 409
    await expect(
      journalStore.commitTurnTransaction(
        userA.uid,
        journal.id,
        0, // Stale count!
        crypto.randomUUID(),
        'Stale msg',
        'Stale reply',
        [],
        {
          abstract: 'Stale overwrite attempt',
          themes: [],
          updatedAt: new Date().toISOString(),
          throughMessageCount: 2,
        }
      )
    ).rejects.toThrow();
  });

  // 15. No-added-memory keeps only bounded current-conversation receipt items and labels sourceKind conversation
  it('15. No-added-memory labels only sourceKind conversation in receipt', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Conversation Receipt Journal');
    const turnId = crypto.randomUUID();

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId,
        message: 'Testing conversation receipt labels',
        memoryScope: 'none',
      });

    expect(res.status).toBe(200);
    const receipt = res.body.provenance as any[];
    for (const item of receipt) {
      expect(item.sourceKind).toBe('conversation');
    }
  });

  // 16. Memory additions label sourceKind memory
  it('16. Memory additions label sourceKind memory in receipt', async () => {
    const journal1 = await journalStore.createJournal(userA.uid, 'Journal One');
    const journal2 = await journalStore.createJournal(userA.uid, 'Journal Two');

    // Add prior turn in Journal Two
    await journalStore.commitTurnTransaction(
      userA.uid,
      journal2.id,
      0,
      crypto.randomUUID(),
      'Past insight from journal two',
      'Model past reply',
      [],
      {
        abstract: 'Past summary',
        themes: ['Memory'],
        updatedAt: new Date().toISOString(),
        throughMessageCount: 2,
      }
    );

    // Chat in Journal One with Memory Lens selecting Journal Two
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal1.id,
        turnId: crypto.randomUUID(),
        message: 'Let us connect with past insight',
        memoryScope: 'selected_journals',
        selectedJournalIds: [journal2.id],
      });

    expect(res.status).toBe(200);
    const receipt = res.body.provenance as any[];
    const memoryItems = receipt.filter((r) => r.sourceKind === 'memory');
    expect(memoryItems.length).toBeGreaterThan(0);
    expect(memoryItems[0].journalId).toBe(journal2.id);
  });

  // 17. Strict schemas reject unknown fields and oversized messages
  it('17. Strict schemas reject unknown fields and oversized messages', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Schema Test');

    // Unknown field
    const res1 = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId: crypto.randomUUID(),
        message: 'Valid message',
        memoryScope: 'none',
        maliciousExtraField: 'injected',
      });
    expect(res1.status).toBe(400);

    // Oversized message (> 4000 chars)
    const longMessage = 'A'.repeat(4005);
    const res2 = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId: crypto.randomUUID(),
        message: longMessage,
        memoryScope: 'none',
      });
    expect(res2.status).toBe(400);
  });

  // 18. Ephemeral This-journal scope is rejected
  it('18. Ephemeral This-journal scope is rejected', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        turnId: crypto.randomUUID(),
        message: 'Ephemeral turn with invalid this_journal scope',
        memoryScope: 'this_journal',
      });
    expect(res.status).toBe(400);
  });

  // 19. /api/config never exposes Gemini configuration
  it('19. /api/config exposes only public Firebase fields and never exposes Gemini keys', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.firebase).toBeDefined();
    expect(res.body.gemini).toBeUndefined();
    expect(res.body.apiKey).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('GEMINI');
  });

  // 20. Private responses contain no-store, no-cache, and Vary Authorization
  it('20. Private responses contain no-store, no-cache, and Vary Authorization', async () => {
    const res = await request(app)
      .get('/api/journals')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers['pragma']).toBe('no-cache');
    expect(res.headers['vary']).toBe('Authorization');
  });

  // 21. Security headers are present
  it('21. Security headers from Helmet are present', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  // 22. Journal deletion is recursive and verified
  it('22. Journal deletion cleans up all descendant messages and parent document', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Journal To Purge');
    await journalStore.commitTurnTransaction(
      userA.uid,
      journal.id,
      0,
      crypto.randomUUID(),
      'User message inside journal',
      'Model reply inside journal',
      [],
      {
        abstract: 'Test summary',
        themes: ['Purge'],
        updatedAt: new Date().toISOString(),
        throughMessageCount: 2,
      }
    );

    // Verify messages exist before deletion
    const msgsBefore = await journalStore.getAllJournalMessages(userA.uid, journal.id);
    expect(msgsBefore.length).toBe(2);

    // Delete via API
    const res = await request(app)
      .delete(`/api/journals/${journal.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify journal and messages are completely gone
    const checkJournal = await journalStore.getJournal(userA.uid, journal.id);
    expect(checkJournal).toBeNull();
    const msgsAfter = await journalStore.getAllJournalMessages(userA.uid, journal.id);
    expect(msgsAfter.length).toBe(0);
  });

  // 23. Full Journal Export returns complete history in chronological order
  it('23. Full Journal Export returns complete history and metadata', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Exportable Journal');
    await journalStore.commitTurnTransaction(
      userA.uid,
      journal.id,
      0,
      crypto.randomUUID(),
      'Export message 1',
      'Export reply 1',
      [],
      {
        abstract: 'Summary 1',
        themes: ['Export'],
        updatedAt: new Date().toISOString(),
        throughMessageCount: 2,
      }
    );

    const res = await request(app)
      .get(`/api/journals/${journal.id}/export`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.exportedAt).toBeDefined();
    expect(res.body.journal.id).toBe(journal.id);
    expect(res.body.messages.length).toBe(2);
    expect(res.body.messages[0].text).toBe('Export message 1');
    expect(res.body.messages[1].text).toBe('Export reply 1');
  });

  // 24. Unicode and multi-lingual journaling support
  it('24. Handles diverse Unicode, emojis, and multilingual text seamlessly', async () => {
    const multiTitle = '日本語のジャーナル 🌟 & Reflections Français';
    const journal = await journalStore.createJournal(userA.uid, multiTitle);
    expect(journal.title).toBe(multiTitle);

    const unicodeText = '✨ Aujourd\'hui j\'ai exploré: 素晴らしいアイディアと機械学習 🧠 #Mindfulness';
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId: crypto.randomUUID(),
        message: unicodeText,
        memoryScope: 'none',
      });

    expect(res.status).toBe(200);
    expect(res.body.userMessage.text).toBe(unicodeText);
  });

  // 25. Rejects empty or whitespace-only journal title creation
  it('25. Rejects empty or whitespace-only journal titles', async () => {
    const res = await request(app)
      .post('/api/journals')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: '   ',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Validation failed');
  });

  // 26. Strict Zod schema rejects unexpected body parameters preventing prototype pollution or injection
  it('26. Strict Zod schema rejects unexpected body parameters preventing parameter injection', async () => {
    const journal = await journalStore.createJournal(userA.uid, 'Boundary Journal');
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        journalId: journal.id,
        turnId: crypto.randomUUID(),
        message: 'Strict schema test',
        memoryScope: 'none',
        adminRole: true,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Validation failed');
  });
});
