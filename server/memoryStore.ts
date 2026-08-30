import {
  Journal,
  Message,
  Summary,
  ProvenanceItem,
  MemoryScope,
} from '../shared/types.js';
import { JournalStore, ResolvedMemoryEntry } from './contracts.js';

export class InMemoryJournalStore implements JournalStore {
  // Map: `${uid}:${journalId}` -> Journal
  private journals = new Map<string, Journal>();
  // Map: `${uid}:${journalId}:${messageId}` -> Message
  private messages = new Map<string, Message>();

  private getJournalKey(uid: string, journalId: string): string {
    return `${uid}:${journalId}`;
  }

  private getMessageKey(uid: string, journalId: string, messageId: string): string {
    return `${uid}:${journalId}:${messageId}`;
  }

  async listJournals(uid: string): Promise<Journal[]> {
    const list: Journal[] = [];
    for (const [key, journal] of this.journals.entries()) {
      if (key.startsWith(`${uid}:`)) {
        list.push({ ...journal });
      }
    }
    // Sort latest updated first, maximum 100
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list.slice(0, 100);
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
    this.journals.set(this.getJournalKey(uid, journalId), journal);
    return { ...journal };
  }

  async getJournal(uid: string, journalId: string): Promise<Journal | null> {
    const key = this.getJournalKey(uid, journalId);
    const journal = this.journals.get(key);
    if (!journal) return null;
    return { ...journal };
  }

  async getJournalMessages(
    uid: string,
    journalId: string,
    limitCount: number = 500
  ): Promise<{ messages: Message[]; totalCount: number; hasOlder: boolean }> {
    const all = await this.getAllJournalMessages(uid, journalId);
    const totalCount = all.length;
    // Newest first for paging, then reverse for chronological display
    const newestFirst = [...all].reverse();
    const paged = newestFirst.slice(0, limitCount);
    const chronological = paged.reverse();
    return {
      messages: chronological,
      totalCount,
      hasOlder: totalCount > limitCount,
    };
  }

  async getAllJournalMessages(uid: string, journalId: string): Promise<Message[]> {
    const prefix = `${uid}:${journalId}:`;
    const list: Message[] = [];
    for (const [key, msg] of this.messages.entries()) {
      if (key.startsWith(prefix)) {
        list.push({ ...msg });
      }
    }
    // Sort strictly chronological
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  }

  async deleteJournal(uid: string, journalId: string): Promise<boolean> {
    const jKey = this.getJournalKey(uid, journalId);
    this.journals.delete(jKey);

    // Delete descendants recursively
    const prefix = `${uid}:${journalId}:`;
    for (const key of Array.from(this.messages.keys())) {
      if (key.startsWith(prefix)) {
        this.messages.delete(key);
      }
    }

    // Verify deletion
    const verifyJournal = this.journals.has(jKey);
    let hasLeftovers = false;
    for (const key of this.messages.keys()) {
      if (key.startsWith(prefix)) {
        hasLeftovers = true;
        break;
      }
    }

    return !verifyJournal && !hasLeftovers;
  }

  async lookupTurn(
    uid: string,
    journalId: string,
    turnId: string
  ): Promise<{ userMessage: Message; modelMessage: Message } | null> {
    const userKey = this.getMessageKey(uid, journalId, `${turnId}-user`);
    const modelKey = this.getMessageKey(uid, journalId, `${turnId}-model`);
    const userMessage = this.messages.get(userKey);
    const modelMessage = this.messages.get(modelKey);
    if (userMessage && modelMessage) {
      return { userMessage: { ...userMessage }, modelMessage: { ...modelMessage } };
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
        // Exclude current history IDs to prevent duplication
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
        // Enforce UID isolation: only load journals below verified UID
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
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const allJournals = await this.listJournals(uid);
      const recent = allJournals.filter((j) => new Date(j.updatedAt).getTime() >= thirtyDaysAgo);
      for (const journal of recent) {
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

    // Limit maximum resolved memory items to 15 to stay within bounds
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
    const jKey = this.getJournalKey(uid, journalId);
    const existing = this.journals.get(jKey);
    if (!existing) {
      throw new Error('NOT_FOUND: Journal does not exist');
    }

    // Optimistic Concurrency check
    if (existing.messageCount !== expectedMessageCount) {
      const error: any = new Error('CONFLICT: Concurrent update detected');
      error.code = 'CONFLICT';
      error.statusCode = 409;
      throw error;
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
      ...existing,
      messageCount: existing.messageCount + 2,
      updatedAt: now,
      summary,
    };

    // Store atomically
    this.messages.set(this.getMessageKey(uid, journalId, userMessage.id), userMessage);
    this.messages.set(this.getMessageKey(uid, journalId, modelMessage.id), modelMessage);
    this.journals.set(jKey, updatedJournal);

    return {
      journal: { ...updatedJournal },
      userMessage: { ...userMessage },
      modelMessage: { ...modelMessage },
    };
  }
}
