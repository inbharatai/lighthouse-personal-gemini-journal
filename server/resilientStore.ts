import {
  Journal,
  Message,
  Summary,
  ProvenanceItem,
  MemoryScope,
} from '../shared/types.js';
import { JournalStore, ResolvedMemoryEntry } from './contracts.js';
import { FirestoreJournalStore } from './firestoreStore.js';
import { InMemoryJournalStore } from './memoryStore.js';

export class ResilientJournalStore implements JournalStore {
  private memoryFallback = new InMemoryJournalStore();
  private firestoreDisabled = false;

  constructor(private firestoreStore: FirestoreJournalStore | null) {}

  private async executeWithFallback<T>(
    firestoreOp: (fs: FirestoreJournalStore) => Promise<T>,
    memoryOp: (mem: InMemoryJournalStore) => Promise<T>
  ): Promise<T> {
    if (this.firestoreStore && !this.firestoreDisabled) {
      try {
        return await firestoreOp(this.firestoreStore);
      } catch (error: any) {
        // If it's a 404 (not found) or 409 (conflict) or validation error from business logic, do not swallow
        if (error.statusCode === 404 || error.statusCode === 409 || error.code === 'CONFLICT') {
          throw error;
        }
        // If it's a Firestore connection / credential / network issue, switch to memory fallback
        this.firestoreDisabled = true;
      }
    }
    return await memoryOp(this.memoryFallback);
  }

  async listJournals(uid: string): Promise<Journal[]> {
    return this.executeWithFallback(
      (fs) => fs.listJournals(uid),
      (mem) => mem.listJournals(uid)
    );
  }

  async createJournal(uid: string, title: string): Promise<Journal> {
    return this.executeWithFallback(
      (fs) => fs.createJournal(uid, title),
      (mem) => mem.createJournal(uid, title)
    );
  }

  async getJournal(uid: string, journalId: string): Promise<Journal | null> {
    return this.executeWithFallback(
      (fs) => fs.getJournal(uid, journalId),
      (mem) => mem.getJournal(uid, journalId)
    );
  }

  async getJournalMessages(
    uid: string,
    journalId: string,
    limitCount?: number
  ): Promise<{ messages: Message[]; totalCount: number; hasOlder: boolean }> {
    return this.executeWithFallback(
      (fs) => fs.getJournalMessages(uid, journalId, limitCount),
      (mem) => mem.getJournalMessages(uid, journalId, limitCount)
    );
  }

  async getAllJournalMessages(uid: string, journalId: string): Promise<Message[]> {
    return this.executeWithFallback(
      (fs) => fs.getAllJournalMessages(uid, journalId),
      (mem) => mem.getAllJournalMessages(uid, journalId)
    );
  }

  async deleteJournal(uid: string, journalId: string): Promise<boolean> {
    return this.executeWithFallback(
      (fs) => fs.deleteJournal(uid, journalId),
      (mem) => mem.deleteJournal(uid, journalId)
    );
  }

  async lookupTurn(
    uid: string,
    journalId: string,
    turnId: string
  ): Promise<{ userMessage: Message; modelMessage: Message } | null> {
    return this.executeWithFallback(
      (fs) => fs.lookupTurn(uid, journalId, turnId),
      (mem) => mem.lookupTurn(uid, journalId, turnId)
    );
  }

  async resolveMemoryEntries(
    uid: string,
    currentJournalId: string | undefined,
    scope: MemoryScope,
    selectedIds: string[] | undefined,
    currentHistoryMessageIds: Set<string>
  ): Promise<ResolvedMemoryEntry[]> {
    return this.executeWithFallback(
      (fs) =>
        fs.resolveMemoryEntries(
          uid,
          currentJournalId,
          scope,
          selectedIds,
          currentHistoryMessageIds
        ),
      (mem) =>
        mem.resolveMemoryEntries(
          uid,
          currentJournalId,
          scope,
          selectedIds,
          currentHistoryMessageIds
        )
    );
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
    return this.executeWithFallback(
      (fs) =>
        fs.commitTurnTransaction(
          uid,
          journalId,
          expectedMessageCount,
          turnId,
          userText,
          modelReply,
          provenance,
          summary
        ),
      (mem) =>
        mem.commitTurnTransaction(
          uid,
          journalId,
          expectedMessageCount,
          turnId,
          userText,
          modelReply,
          provenance,
          summary
        )
    );
  }
}
