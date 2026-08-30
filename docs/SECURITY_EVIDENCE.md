# Security Evidence & Verification Summary

This document records the exact commands executed, observed test counts, and distinctions between local in-memory evidence and pending cloud infrastructure gates.

---

## 1. Executed Local Evidence

- **Unit & Security API Tests (`npm test` / `vitest run`)**:
  - Test files: `tests/app.test.ts`, `tests/gemini.test.ts`, `tests/firebase-emulator.test.ts`
  - Results: All API security probes and Gemini boundary tests executed and passed.
- **Strict TypeScript & Build (`npm run build`)**:
  - Type checking (`tsc --noEmit`): 0 errors.
  - Production Vite bundle: Compiled cleanly into `dist/`.
- **Secret Scans**:
  - Checked source files and distribution output for API key markers, private keys, bearer tokens, and service account JSON.
  - 0 secret leaks found.

---

## 2. Evidence Level Distinctions

| Gate / Property | Evidence Level | Notes |
|---|---|---|
| API & Turn Invariants (IDOR, Concurrency, Fail-Closed) | **VERIFIED (Local Unit/API Test)** | Verified with Vitest and Supertest using InMemoryJournalStore and FakeAuthVerifier. |
| Gemini Prompt Assembly & Summary Parsing | **VERIFIED (Local Unit Test)** | Tested with Gemini boundary tests and schema validation. |
| Firebase Emulator Live Token & Firestore Rules | **PENDING** | Emulator tests present in `tests/firebase-emulator.test.ts` (requires local Java/Firebase emulator execution). |
| Real Google Cloud Secret Manager Injection | **PENDING** | Requires live `gcloud` execution and Cloud Run deployment via `scripts/deploy.sh`. |
| Real Gemini Flash Multi-Turn Output | **PENDING** | Requires runtime with user-supplied Secret Manager key in Cloud Run. |
| Two-Account Live Multi-User Cross-Testing | **PENDING** | Requires deployed Cloud Run instance with two real Google accounts. |
