import { Journal, Message, Summary, ProvenanceItem, MemoryScope, MessageRole } from '../shared/types.js';

export interface VerifiedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  authTime: string;
}

export interface AuthVerifier {
  verifyToken(authHeader: string | undefined): Promise<VerifiedUser>;
}

export interface ResolvedMemoryEntry {
  journalId: string;
  journalTitle: string;
  messageId: string;
  role: MessageRole;
  createdAt: string;
  excerpt: string;
}

export interface JournalStore {
  listJournals(uid: string): Promise<Journal[]>;
  createJournal(uid: string, title: string): Promise<Journal>;
  getJournal(uid: string, journalId: string): Promise<Journal | null>;
  getJournalMessages(
    uid: string,
    journalId: string,
    limitCount?: number
  ): Promise<{ messages: Message[]; totalCount: number; hasOlder: boolean }>;
  getAllJournalMessages(uid: string, journalId: string): Promise<Message[]>;
  deleteJournal(uid: string, journalId: string): Promise<boolean>;
  lookupTurn(
    uid: string,
    journalId: string,
    turnId: string
  ): Promise<{ userMessage: Message; modelMessage: Message } | null>;
  resolveMemoryEntries(
    uid: string,
    currentJournalId: string | undefined,
    scope: MemoryScope,
    selectedIds: string[] | undefined,
    currentHistoryMessageIds: Set<string>
  ): Promise<ResolvedMemoryEntry[]>;
  commitTurnTransaction(
    uid: string,
    journalId: string,
    expectedMessageCount: number,
    turnId: string,
    userText: string,
    modelReply: string,
    provenance: ProvenanceItem[],
    summary: Summary
  ): Promise<{ journal: Journal; userMessage: Message; modelMessage: Message }>;
}

export interface AiClient {
  generateReply(params: {
    currentHistory: { role: MessageRole; text: string; messageId?: string }[];
    userMessage: string;
    memoryExcerpts: ResolvedMemoryEntry[];
    prismMode?: string;
  }): Promise<string>;

  generateSummary(params: {
    previousSummary: Summary | null;
    recentTurns: { role: MessageRole; text: string }[];
    newTurn: { userText: string; modelReply: string };
    throughMessageCount: number;
  }): Promise<Summary>;
}
