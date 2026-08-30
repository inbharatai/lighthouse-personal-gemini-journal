# Lighthouse Security Constitution

This document defines the non-negotiable security rules, architectural boundaries, and release-blocking invariants for Lighthouse.

---

## 1. Protected Assets

1. **User Journal Content & Turns**: Private thoughts, reflections, conversation histories, and structured summaries.
2. **Identity Credentials & Tokens**: Firebase ID tokens, session tokens, and decoded user identities.
3. **AI Secrets**: Gemini API keys and Google Cloud Secret Manager references.
4. **Cloud Infrastructure**: Cloud Run runtime identity (`lighthouse-runtime`), Firestore database collections, and IAM roles.

---

## 2. Actors & Threat Profile

- **Owner (Authenticated User A)**: Legitimate user accessing their own journals and turns.
- **Adversary (Authenticated User B / Attacker)**: Malicious actor possessing valid Firebase credentials attempting IDOR, cross-tenant data access, foreign memory injection, or deletion.
- **Unauthenticated Visitor**: Anonymous web client attempting unauthorized access, configuration scraping, or Denial-of-Service.
- **AI Model (Gemini)**: External inference engine treated as an untrusted boundary. All model outputs and memory excerpts are sanitized data, never trusted commands.

---

## 3. Mandatory Security Invariants

### 1. Identity & Token Derivation
- All private endpoints require a valid Firebase ID token in `Authorization: Bearer <token>`.
- The backend verifies the token using Firebase Admin SDK with revocation checking.
- The `UID` is derived solely from the cryptographically verified token payload.
- Requests attempting to provide a `uid`, `userId`, `owner`, or `role` in the request body, query params, or headers are rejected or ignored.

### 2. Firestore Path & Query Isolation
- All user data is structured under `users/{verifiedUid}/journals/{journalId}` and `users/{verifiedUid}/journals/{journalId}/messages/{messageId}`.
- Every database query and path is constructed server-side from the verified UID.
- Direct client access to Firestore is completely denied by `firestore.rules` (`allow read, write: if false;`).
- Non-owned or non-existent resources always return **404 Not Found** without leaking whether the resource exists under another user.

### 3. Secret Protection & Cloud Identity
- `GEMINI_API_KEY` is never exposed in frontend code, client bundles, `VITE_` variables, or committed repository files.
- In Cloud Run, `GEMINI_API_KEY` is injected from Google Cloud Secret Manager into a server-only environment variable.
- Cloud Run uses a dedicated least-privilege service account (`lighthouse-runtime`) with access restricted to Secret Manager accessor on `lighthouse-gemini-api-key` and `roles/datastore.user`.

### 4. Atomic Turn Persistence & Idempotency
- Each persistent turn requires a client-generated UUID `turnId`.
- Idempotent retries with identical `turnId` and text return the stored reply, provenance, and summary without repeat Gemini calls.
- In-flight turns are committed in an atomic Firestore transaction verifying optimistic concurrency (`messageCount === expectedMessageCount`).
- If reply generation or summary generation fails, **zero state is stored** (fail closed).

### 5. Ephemeral Reflection Isolation
- Ephemeral turns hold conversation state only in active browser memory (up to 20 items).
- Ephemeral mode performs **zero Firestore writes** and returns `summary: null`, `persisted: false`.
- Ephemeral data clears completely on tab refresh, sign-out, or user change.

### 6. Cache, Headers & Privacy
- All authenticated responses set `Cache-Control: private, no-store`, `Pragma: no-cache`, `Vary: Authorization`.
- Sensitive data (prompts, raw user text, model replies, identity tokens) is never logged to server logs.
