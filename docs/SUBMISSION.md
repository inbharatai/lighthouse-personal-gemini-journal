# Lighthouse — Project Submission & Verification Overview

**Project Title**: Lighthouse — Private Personal Gemini Journal  
**Target Platform**: Google Cloud Run, Cloud Firestore, Firebase Authentication, Google Gemini 2.5 Flash

---

## 1. Executive Summary

Lighthouse is a full-stack, consent-aware, privacy-first personal AI journal built with React 19, TypeScript, Express 5, Cloud Firestore, and Google Gemini. It solves the critical privacy and security challenges of modern AI journaling by giving users complete control over AI memory context (Memory Lens), transparent cryptographic provenance (verifiable Memory Receipts), zero-persistence reflection (Ephemeral Mode), and server-mediated tenant isolation under `users/{verifiedUid}/...` with default-deny client Firestore rules.

---

## 2. Key Capabilities & Innovations

### 1. Granular AI Memory Consent (Memory Lens)
Unlike typical AI chatbots that either have no memory or indiscriminately ingest all past conversations, Lighthouse provides four distinct, user-controlled memory scopes:
- **No added memory**: Gemini receives only the bounded current conversation for the turn.
- **This journal only**: Historical turns from the active journal only.
- **Selected journals**: Only explicitly checked journals.
- **Recent journals**: Journals active within the past 30 days.

### 2. Verifiable Memory Receipts
Every model response contains an inspectable receipt detailing the exact provenance of all context passed to Gemini:
- Distinguishes `sourceKind: conversation` from `sourceKind: memory`.
- Links exact message IDs, source journal titles, and bounded excerpt text.

### 3. Automatic Structured Summaries
Every persistent turn commits user text, model reply, and an automated structured summary (`abstract` + `themes`) generated server-side using Gemini's structured JSON schema. The summary is displayed prominently in the UI to give users instant thematic clarity over their evolving reflections.

### 4. Ephemeral Reflection Mode
A dedicated tab-only mode for quick brainstorming, immediate processing, or sensitive thoughts. It keeps at most 20 turns in browser memory, performs **zero Firestore writes**, and returns `summary: null`.

### 5. Multi-Tenant Security & Defense-in-Depth
- **Firebase Auth**: Verifies ID tokens via Firebase Admin SDK with token revocation checks.
- **Firestore Isolation**: All data is structured under `users/{verifiedUid}/journals/{journalId}`.
- **Client Access Denied**: `firestore.rules` enforces `allow read, write: if false;` for direct browser requests.
- **Secret Protection**: `GEMINI_API_KEY` is injected from Google Cloud Secret Manager into Cloud Run. No client-side exposure.

---

## 3. Test Suite & Verification Results

### Executed Tests
- **API & Security Test Suite (`tests/app.test.ts`)**: 21/21 tests passing.
  - Token rejection (missing, invalid)
  - Two-user IDOR isolation (read, delete, export, chat)
  - Foreign Memory Lens ID rejection
  - Atomic turn transaction & summary creation
  - Ephemeral zero-persistence mode
  - Fail-closed on summary error
  - Turn idempotency and concurrency conflict detection
  - Private no-store and Helmet security headers
- **Gemini Unit & Schema Tests (`tests/gemini.test.ts`)**: 4/4 tests passing.
- **Frontend & Server Build**: Vite and TypeScript compilation succeeded without errors.

### Verification Status

| Gate | Status | Evidence |
|---|---|---|
| API & Security Unit Tests | **PASS** | 25/25 automated tests passed in Vitest |
| TypeScript Strict Compilation | **PASS** | `tsc --noEmit` & `npm run build` passed |
| Secret Scanning | **PASS** | Zero keys or tokens in source or bundle |
| Cloud Run Live Deployment | **PENDING** | Requires user's Cloud Project & Secret Manager key |
| Live Firebase Emulator | **PENDING** | Requires local Java and Firebase CLI |
| Live Two-Account Testing | **PENDING** | Requires deployed Cloud Run environment |

---

## 4. Documentation Index

- [Architecture & Data Model](ARCHITECTURE.md)
- [Threat Model](THREAT_MODEL.md)
- [Security Constitution](AI_STUDIO_SECURITY_CONSTITUTION.md)
- [Requirements Matrix](OFFICIAL_REQUIREMENTS_MATRIX.md)
- [Prompt Pack](GOOGLE_AI_STUDIO_PROMPT_PACK.md)
- [Iteration Log](AI_STUDIO_ITERATION_LOG.md)
- [Windows Git Bash Cloud Handoff Prompt](CLAUDE_CLOUD_HANDOFF_PROMPT.md)
