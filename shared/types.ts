import { z } from 'zod';

// ==========================================
// DATA MODELS & SCHEMAS
// ==========================================

export const MemoryScopeSchema = z.enum([
  'none',              // No added memory
  'this_journal',      // Older entries from active journal
  'selected_journals', // Explicit user-chosen journals
  'recent_journals',   // Journals updated within last 30 days
]);
export type MemoryScope = z.infer<typeof MemoryScopeSchema>;

export const SourceKindSchema = z.enum(['conversation', 'memory']);
export type SourceKind = z.infer<typeof SourceKindSchema>;

export const MessageRoleSchema = z.enum(['user', 'model']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const SummarySchema = z.object({
  abstract: z.string().min(1).max(700),
  themes: z.array(z.string().max(80)).max(5),
  updatedAt: z.string().datetime(),
  throughMessageCount: z.number().int().nonnegative(),
});
export type Summary = z.infer<typeof SummarySchema>;

export const ProvenanceItemSchema = z.object({
  journalId: z.string().uuid().or(z.literal('ephemeral')),
  journalTitle: z.string().max(100),
  messageId: z.string().max(100),
  role: MessageRoleSchema,
  sourceKind: SourceKindSchema,
  createdAt: z.string().datetime(),
  excerpt: z.string().max(500),
});
export type ProvenanceItem = z.infer<typeof ProvenanceItemSchema>;

export const MessageSchema = z.object({
  id: z.string().max(100),
  turnId: z.string().uuid(),
  role: MessageRoleSchema,
  text: z.string().min(1).max(10000),
  createdAt: z.string().datetime(),
  provenance: z.array(ProvenanceItemSchema).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const JournalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  messageCount: z.number().int().nonnegative(),
  summary: SummarySchema.nullable(),
});
export type Journal = z.infer<typeof JournalSchema>;

// ==========================================
// API REQUEST & RESPONSE SCHEMAS
// ==========================================

export const CreateJournalRequestSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(100, 'Title cannot exceed 100 characters'),
}).strict();
export type CreateJournalRequest = z.infer<typeof CreateJournalRequestSchema>;

export const EphemeralHistoryItemSchema = z.object({
  role: MessageRoleSchema,
  text: z.string().min(1).max(10000),
  createdAt: z.string().datetime(),
}).strict();
export type EphemeralHistoryItem = z.infer<typeof EphemeralHistoryItemSchema>;

export const ChatRequestSchema = z.object({
  journalId: z.string().uuid().optional(),
  turnId: z.string().uuid(),
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message cannot exceed 4000 characters'),
  prismMode: z.enum(['socratic', 'stoic', 'strategist', 'compassion', 'first_principles']).optional(),
  memoryScope: MemoryScopeSchema,
  selectedJournalIds: z.array(z.string().uuid()).max(10).optional(),
  ephemeralHistory: z.array(EphemeralHistoryItemSchema).max(20).optional(),
}).strict().superRefine((data, ctx) => {
  // Validate persistent vs ephemeral constraints
  if (!data.journalId) {
    if (data.memoryScope === 'this_journal') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['memoryScope'],
        message: 'This-journal memory scope requires an active persistent journal.',
      });
    }
  } else {
    if (data.ephemeralHistory && data.ephemeralHistory.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ephemeralHistory'],
        message: 'Ephemeral history cannot be provided for persistent journals.',
      });
    }
  }
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export interface ChatResponse {
  reply: string;
  provenance: ProvenanceItem[];
  persisted: boolean;
  summary: Summary | null;
  turnId: string;
  userMessage?: Message;
  modelMessage?: Message;
}

export interface JournalDetailResponse {
  journal: Journal;
  messages: Message[];
  hasOlderMessages: boolean;
  totalMessages: number;
}

export interface JournalExportResponse {
  exportedAt: string;
  journal: Journal;
  messages: Message[];
}

export interface UserMeResponse {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  authTime: string;
}

export interface PublicConfigResponse {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
  };
}
