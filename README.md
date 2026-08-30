# Lighthouse — Private Personal Gemini Journal

> A consent-aware, privacy-first personal journal with multi-turn Gemini reflections, Memory Lens context scoping, verifiable Memory Receipts, and automated structured summaries.

---

## 1. Product Overview

Lighthouse is a full-stack personal AI journal built for deep reflection, structured brainstorming, and private introspection.

### Core Features & Enhancements

1. **Firebase Authentication (Google Provider)**: Strict identity verification using Firebase ID tokens transmitted via `Authorization: Bearer <token>`.
2. **Server-Mediated Firestore Isolation**: All journals and turns live under `users/{verifiedUid}/journals/{journalId}`. Direct browser/mobile access is denied at the database rule layer (`firestore.rules`).
3. **Multi-Turn Reflective Conversations**: Gemini Flash companion provides grounded, non-diagnostic reflection with one thoughtful observation and one open-ended question.
4. **Automatic Turn Summaries**: Every successful persistent turn atomically commits user text, model reply, provenance receipt, and a structured summary (`abstract` + `themes`).
5. **Memory Lens**: Granular user consent over past memories:
   - *No added memory*: Bounded to the latest 20 current-turn conversation items.
   - *This journal*: Includes historical excerpts from the active journal.
   - *Selected journals*: Explicitly chosen cross-journal entries.
   - *Recent journals*: Bounded entries from journals active within the last 30 days.
6. **Verifiable Memory Receipts**: Every Gemini response attaches a receipt detailing exact `sourceKind` (`conversation` vs `memory`), message IDs, timestamps, and bounded excerpts.
7. **Ephemeral Reflection**: Zero-persistence brainstorming mode holding at most 20 tab turns in browser memory, never writing to Firestore, and returning `summary: null`.
8. **Permanent Deletion & Export**: Full chronological history export and verifiable recursive deletion of journals and all descendant messages.

---

## 2. Technical Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js 24, Express 5, TypeScript
- **Database & Identity**: Cloud Firestore, Firebase Authentication, Firebase Admin SDK
- **AI Service**: Server-side Gemini REST API (@google/genai) with structured schema responses
- **Security & Reliability**: Helmet, express-rate-limit, Zod strict schema validation, Vitest, Supertest
- **Cloud Infrastructure**: Google Cloud Run (non-root container), Google Cloud Secret Manager

---

## 3. Local Development & Verification

### Prerequisites
- Node.js 22+ or 24
- npm

### Quick Start

```bash
# 1. Clone repository and install dependencies
npm install

# 2. Run test suites (unit, security, and API tests)
npm test

# 3. Run type check and production build
npm run build

# 4. Start local development server (Port 3000)
npm run dev
```

### Environment Variables
Copy `.env.example` to `.env.local` for local secrets. Never commit `.env.local` or prefix server secrets with `VITE_`.

---

## 4. Documentation Index

- [Security Constitution](docs/AI_STUDIO_SECURITY_CONSTITUTION.md)
- [Threat Model](docs/THREAT_MODEL.md)
- [Architecture & Data Flow](docs/ARCHITECTURE.md)
- [Google AI Studio Instructions](docs/AI_STUDIO_INSTRUCTIONS.md)
- [Google AI Studio Prompt Pack](docs/GOOGLE_AI_STUDIO_PROMPT_PACK.md)
- [AI Studio Iteration Log](docs/AI_STUDIO_ITERATION_LOG.md)
- [Requirements Matrix](docs/OFFICIAL_REQUIREMENTS_MATRIX.md)
- [Security Evidence](docs/SECURITY_EVIDENCE.md)
- [Windows Git Bash Cloud Handoff Prompt](docs/CLAUDE_CLOUD_HANDOFF_PROMPT.md)
- [Submission & Demo Guide](docs/SUBMISSION.md)
