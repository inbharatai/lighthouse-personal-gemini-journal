# Lighthouse Architecture & Data Model

Lighthouse is a full-stack, consent-aware AI journaling system with strict tenant isolation, server-mediated Firestore storage, and structured Gemini companion reflections.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Browser ["Web Browser Client (React 19 + Vite)"]
        UI[Lighthouse UI & State Manager]
        AuthClient[Firebase Auth Client SDK]
        EphemeralState[In-Memory Ephemeral Store (max 20 turns)]
    end

    subgraph SecurityBoundary ["Security & Ingress Boundary"]
        ReverseProxy[Nginx / Cloud Run Ingress]
        HelmetMiddleware[Helmet CSP & Security Headers]
        RateLimiter[Express Rate Limiter]
        AuthMiddleware[Firebase Admin Token Verifier]
    end

    subgraph ServerBackend ["Cloud Run Backend (Node 24 + Express 5)"]
        ChatEngine[Turn & Chat Controller]
        MemoryResolver[Memory Lens Scoper]
        GeminiREST[Server-Side Gemini REST Client]
        TxManager[Firestore Transaction Manager]
    end

    subgraph CloudStorage ["Google Cloud Infrastructure"]
        SecretManager[Google Cloud Secret Manager (GEMINI_API_KEY)]
        FirestoreDB[Cloud Firestore Native Database]
        GeminiAPI[Google Gemini 2.5 Flash API]
    end

    UI -->|Google Sign-In Popup| AuthClient
    UI -->|HTTPS + Bearer ID Token| ReverseProxy
    ReverseProxy --> HelmetMiddleware --> RateLimiter --> AuthMiddleware
    AuthMiddleware -->|Derive Verified UID| ChatEngine

    ChatEngine -->|Resolve Consented Context| MemoryResolver
    MemoryResolver -->|UID-Scoped Read| FirestoreDB
    ChatEngine -->|Bounded History + Memory JSON| GeminiREST
    SecretManager -.->|Injected on Startup| GeminiREST
    GeminiREST -->|1. Generate Reply\n2. Generate Summary Schema| GeminiAPI
    GeminiAPI -->|Structured JSON Output| GeminiREST

    ChatEngine -->|Atomic Turn Commit Transaction| TxManager
    TxManager -->|users/{verifiedUid}/...| FirestoreDB
```

---

## 2. Firestore Data Model

### Collections Hierarchy
```
users/
  └── {verifiedUid}/
        └── journals/
              └── {journalId}/
                    ├── (Journal Document)
                    └── messages/
                          ├── {turnId}-user
                          └── {turnId}-model
```

### Document Schemas

#### Journal Document
```typescript
interface Journal {
  id: string;             // UUID
  title: string;          // 1-100 characters
  createdAt: string;      // ISO 8601 UTC
  updatedAt: string;      // ISO 8601 UTC
  messageCount: number;   // Total turns * 2
  summary: Summary | null;
}

interface Summary {
  abstract: string;               // 1-700 characters
  themes: string[];               // 0-5 strings (each max 80 chars)
  updatedAt: string;              // ISO 8601 UTC
  throughMessageCount: number;    // Count at summary generation
}
```

#### Message Document
```typescript
interface Message {
  id: string;                     // {turnId}-user or {turnId}-model
  turnId: string;                 // Client-generated UUID
  role: 'user' | 'model';
  text: string;                   // Up to 10,000 characters
  createdAt: string;              // ISO 8601 UTC
  provenance?: ProvenanceItem[];  // Model messages only
}

interface ProvenanceItem {
  journalId: string;             // UUID or 'ephemeral'
  journalTitle: string;          // Max 100 chars
  messageId: string;             // e.g. {turnId}-user
  role: 'user' | 'model';
  sourceKind: 'conversation' | 'memory';
  createdAt: string;             // ISO 8601 UTC
  excerpt: string;               // Bounded to 500 characters
}
```

---

## 3. Persistent Turn Execution Lifecycle

1. **Token Ingress & Authentication**: Express middleware decodes Firebase token, checks revocation, and derives verified `uid`.
2. **Deterministic Turn Lookup**: Direct `.doc({turnId}-user)` and `.doc({turnId}-model)` get.
   - *Duplicate with same text*: Return stored turn (skip AI call).
   - *Duplicate with different text*: Return `409 Conflict`.
3. **Context Assembly**:
   - Query last 20 messages from active journal (`sourceKind: conversation`).
   - Query Memory Lens additions strictly under `users/{verifiedUid}` (`sourceKind: memory`).
4. **AI Generation**:
   - Gemini companion reply call with 30s timeout and safety settings.
   - Gemini structured summary call with low temperature and JSON response schema.
5. **Atomic Commit**:
   - Transaction checks `journal.messageCount === expectedMessageCount`.
   - Atomically writes user document, model document (with provenance receipt), and updates journal metadata and summary.
   - Fail closed if any step fails.
