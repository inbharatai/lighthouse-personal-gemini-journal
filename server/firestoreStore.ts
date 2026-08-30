import { Firestore } from 'firebase-admin/firestore';
import {
  Journal,
  Message,
  Summary,
  ProvenanceItem,
  MemoryScope,
} from '../shared/types.js';
import { JournalStore, ResolvedMemoryEntry } from './contracts.js';

export class FirestoreJournalStore implements JournalStore {
  constructor(private db: Firestore) {}

  private userDoc(uid: string) {
    return this.db.collection('users').doc(uid);
  }

  private journalsCollection(uid: string) {
    return this.userDoc(uid).collection('journals');
  }

  private journalDoc(uid: string, journalId: string) {
    return this.journalsCollection(uid).doc(journalId);
  }

  private messagesCollection(uid: string, journalId: string) {
    return this.journalDoc(uid, journalId).collection('messages');
  }

  private messageDoc(uid: string, journalId: string, messageId: string) {
    return this.messagesCollection(uid, journalId).doc(messageId);
  }

  async listJournals(uid: string): Promise<Journal[]> {
    const snap = await this.journalsCollection(uid)
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get();

    return snap.docs.map((d) => d.data() as Journal);
  }

  async createJournal(uid: string, title: string): Promise<Journal> {
    const journalId = crypto.randomUUID();
    const now = new Date().toISOString();
    const journal: Journal = {
      id: journalId,
      title: title.trim(),
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      summary: null,
    };

    await this.journalDoc(uid, journalId).set(journal);
    return journal;
  }

  async getJournal(uid: string, journalId: string): Promise<Journal | null> {
    const snap = await this.journalDoc(uid, journalId).get();
    if (!snap.exists) return null;
    return snap.data() as Journal;
  }

  async getJournalMessages(
    uid: string,
    journalId: string,
    limitCount: number = 500
  ): Promise<{ messages: Message[]; totalCount: number; hasOlder: boolean }> {
    const journal = await this.getJournal(uid, journalId);
    if (!journal) {
      return { messages: [], totalCount: 0, hasOlder: false };
    }

    const totalCount = journal.messageCount;

    // Fetch latest limitCount messages ordered by createdAt descending
    const snap = await this.messagesCollection(uid, journalId)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const newestFirst = snap.docs.map((d) => d.data() as Message);
    const chronological = newestFirst.reverse();

    return {
      messages: chronological,
      totalCount,
      hasOlder: totalCount > limitCount,
    };
  }

  async getAllJournalMessages(uid: string, journalId: string): Promise<Message[]> {
    const snap = await this.messagesCollection(uid, journalId)
      .orderBy('createdAt', 'asc')
      .get();

    return snap.docs.map((d) => d.data() as Message);
  }

  async deleteJournal(uid: string, journalId: string): Promise<boolean> {
    const jRef = this.journalDoc(uid, journalId);
    const mColl = this.messagesCollection(uid, journalId);

    // Delete descendants first (even if parent is missing or partially deleted)
    const mSnap = await mColl.get();
    const batch = this.db.batch();
    for (const doc of mSnap.docs) {
      batch.delete(doc.ref);
    }
    batch.delete(jRef);
    await batch.commit();

    // Verify both parent and descendants are absent
    const checkParent = await jRef.get();
    const checkMessages = await mColl.limit(1).get();

    if (checkParent.exists || !checkMessages.empty) {
      throw new Error('DELETE_VERIFICATION_FAILED: Descendants or parent could not be verified as deleted');
    }

    return true;
  }

  async lookupTurn(
    uid: string,
    journalId: string,
    turnId: string
  ): Promise<{ userMessage: Message; modelMessage: Message } | null> {
    const userDocRef = this.messageDoc(uid, journalId, `${turnId}-user`);
    const modelDocRef = this.messageDoc(uid, journalId, `${turnId}-model`);

    const [userSnap, modelSnap] = await Promise.all([
      userDocRef.get(),
      modelDocRef.get(),
    ]);

    if (userSnap.exists && modelSnap.exists) {
      return {
        userMessage: userSnap.data() as Message,
        modelMessage: modelSnap.data() as Message,
      };
    }

    return null;
  }

  async resolveMemoryEntries(
    uid: string,
    currentJournalId: string | undefined,
    scope: MemoryScope,
    selectedIds: string[] | undefined,
    currentHistoryMessageIds: Set<string>
  ): Promise<ResolvedMemoryEntry[]> {
    if (scope === 'none') {
      return [];
    }

    const resolved: ResolvedMemoryEntry[] = [];

    if (scope === 'this_journal' && currentJournalId) {
      const journal = await this.getJournal(uid, currentJournalId);
      if (journal) {
        const msgs = await this.getAllJournalMessages(uid, currentJournalId);
        for (const msg of msgs) {
          if (!currentHistoryMessageIds.has(msg.id)) {
            resolved.push({
              journalId: journal.id,
              journalTitle: journal.title,
              messageId: msg.id,
              role: msg.role,
              createdAt: msg.createdAt,
              excerpt: msg.text.slice(0, 500),
            });
          }
        }
      }
    } else if (scope === 'selected_journals' && selectedIds && selectedIds.length > 0) {
      for (const jId of selectedIds) {
        // UID isolation: only query under verified UID
        const journal = await this.getJournal(uid, jId);
        if (journal) {
          const msgs = await this.getAllJournalMessages(uid, jId);
          for (const msg of msgs) {
            if (!currentHistoryMessageIds.has(msg.id)) {
              resolved.push({
                journalId: journal.id,
                journalTitle: journal.title,
                messageId: msg.id,
                role: msg.role,
                createdAt: msg.createdAt,
                excerpt: msg.text.slice(0, 500),
              });
            }
          }
        }
      }
    } else if (scope === 'recent_journals') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const snap = await this.journalsCollection(uid)
        .where('updatedAt', '>=', thirtyDaysAgo)
        .limit(20)
        .get();

      for (const doc of snap.docs) {
        const journal = doc.data() as Journal;
        const msgs = await this.getAllJournalMessages(uid, journal.id);
        for (const msg of msgs) {
          if (!currentHistoryMessageIds.has(msg.id)) {
            resolved.push({
              journalId: journal.id,
              journalTitle: journal.title,
              messageId: msg.id,
              role: msg.role,
              createdAt: msg.createdAt,
              excerpt: msg.text.slice(0, 500),
            });
          }
        }
      }
    }

    return resolved.slice(-15);
  }

  async commitTurnTransaction(
    uid: string,
    journalId: string,
    expectedMessageCount: number,
    turnId: string,
    userText: string,
    modelReply: string,
    provenance: ProvenanceItem[],
    summary: Summary
  ): Promise<{ journal: Journal; userMessage: Message; modelMessage: Message }> {
    const jRef = this.journalDoc(uid, journalId);
    const userMsgRef = this.messageDoc(uid, journalId, `${turnId}-user`);
    const modelMsgRef = this.messageDoc(uid, journalId, `${turnId}-model`);

    return await this.db.runTransaction(async (t) => {
      const jSnap = await t.get(jRef);
      if (!jSnap.exists) {
        const notFound: any = new Error('NOT_FOUND: Journal not found');
        notFound.statusCode = 404;
        throw notFound;
      }

      const existingJournal = jSnap.data() as Journal;
      if (existingJournal.messageCount !== expectedMessageCount) {
        const conflict: any = new Error('CONFLICT: Concurrent turn committed');
        conflict.statusCode = 409;
        throw conflict;
      }

      const now = new Date().toISOString();
      const userMessage: Message = {
        id: `${turnId}-user`,
        turnId,
        role: 'user',
        text: userText,
        createdAt: now,
      };

      const modelMessage: Message = {
        id: `${turnId}-model`,
        turnId,
        role: 'model',
        text: modelReply,
        createdAt: new Date(Date.now() + 1).toISOString(),
        provenance,
      };

      const updatedJournal: Journal = {
        ...existingJournal,
        messageCount: existingJournal.messageCount + 2,
        updatedAt: now,
        summary,
      };

      t.set(userMsgRef, userMessage);
      t.set(modelMsgRef, modelMessage);
      t.set(jRef, updatedJournal);

      return {
        journal: updatedJournal,
        userMessage,
        modelMessage,
      };
    });
  }
}
