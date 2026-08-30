# Official Requirements & Verification Matrix

| Requirement | Implementation Component | Evidence / Test Status | Result |
|---|---|---|---|
| **Firebase Google Sign-In** | `/src/firebase.ts`, `/server/auth.ts` | Supertest tests 1 & 2 (`tests/app.test.ts`) | **PASS (Local)** / PENDING (Live Firebase) |
| **Server-Mediated Firestore Isolation** | `users/{verifiedUid}/...`, `/firestore.rules` | Supertest tests 3, 4, 5, 6, 7 (`tests/app.test.ts`) | **PASS (Local)** / PENDING (Live Cloud Firestore) |
| **Server-Only Gemini Integration** | `/server/gemini.ts`, `/server/app.ts` | Supertest test 8 & `tests/gemini.test.ts` | **PASS (Mock/Unit)** / PENDING (Live Gemini API Key) |
| **Automatic Turn Summaries** | `/server/gemini.ts`, `/server/app.ts` | Supertest test 9 & 11 (`tests/app.test.ts`) | **PASS (Local)** |
| **Memory Lens (4 Scopes)** | `/shared/types.ts`, `/server/memoryStore.ts`, `/src/components/MemoryLensModal.tsx` | Supertest test 15 & 16 (`tests/app.test.ts`) | **PASS (Local)** |
| **Verifiable Memory Receipts** | `/shared/types.ts`, `/server/app.ts`, `/src/components/MemoryReceiptModal.tsx` | Supertest test 15 & 16 (`tests/app.test.ts`) | **PASS (Local)** |
| **Ephemeral Reflection (0 writes)** | `/server/app.ts`, `/src/App.tsx` | Supertest test 10 & 18 (`tests/app.test.ts`) | **PASS (Local)** |
| **Turn Idempotency & Concurrency** | `/server/app.ts`, `/server/memoryStore.ts` | Supertest tests 12, 13, 14 (`tests/app.test.ts`) | **PASS (Local)** |
| **Secret Manager Deployment** | `/scripts/deploy.sh`, `/Dockerfile` | Shell syntax validation & Dockerfile review | **PASS (Syntax)** / PENDING (Cloud Run Deploy) |
| **No-Store & Security Headers** | `/server/app.ts` (Helmet, Cache-Control) | Supertest tests 19, 20, 21 (`tests/app.test.ts`) | **PASS (Local)** |
