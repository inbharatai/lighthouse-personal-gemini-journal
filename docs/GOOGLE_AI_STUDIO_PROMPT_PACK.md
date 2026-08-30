# Google AI Studio Prompt Pack

This pack contains ordered, copy-paste prompts for iterating, auditing, demoing, and promoting Lighthouse in Google AI Studio.

---

## Prompt 1: Initial System & Security Initialization

```text
Act as a senior full-stack engineer and Firebase security auditor.
Initialize the Lighthouse Personal Gemini Journal application:
- Configure Firebase Authentication for Google sign-in.
- Enforce server-mediated Cloud Firestore path isolation under users/{verifiedUid}/journals/...
- Implement Memory Lens context scoping with verifiable Memory Receipts.
- Implement Ephemeral Reflection mode with 0 Firestore writes.
- Enforce atomic turn transactions with automated structured summaries (abstract + themes).
- Ensure strict Zod schema validation, Helmet security headers, and rate limiting.
```

---

## Prompt 2: Adversarial Security & Invariant Audit

```text
Execute an adversarial audit on the Lighthouse backend:
1. Verify token rejection for missing/invalid bearer tokens.
2. Probe IDOR isolation between User A and User B for journal read, delete, export, and chat.
3. Test foreign journal ID injection into Memory Lens.
4. Verify turn idempotency: same turnId with identical text skips AI calls; changed text yields 409 Conflict.
5. Verify fail-closed behavior on summary generation error.
6. Verify no-store and no-cache headers on all authenticated API routes.
```

---

## Prompt 3: 90-Second Video Demonstration Walkthrough

```text
Draft a precise 90-second video demo script for Lighthouse:
- 0:00-0:15: Introduction & Security Overview (Google sign-in, Firestore path isolation, Secret Manager).
- 0:15-0:35: Creating a journal and holding a reflective multi-turn session with Gemini.
- 0:35-0:55: Demonstrating Memory Lens (scoping context to past journals) and inspecting the verifiable Memory Receipt.
- 0:55-1:15: Automatic conversation summary generation and themes card.
- 1:15-1:30: Ephemeral Reflection mode (zero Firestore writes) and permanent recursive deletion.
```

---

## Prompt 4: Social Announcement & Submission Post

```text
Write a concise, professional social media post announcing Lighthouse:
- Highlight the privacy-first architecture (Firebase Auth, Cloud Run, Secret Manager, Firestore deny-all rules).
- Introduce Memory Lens and verifiable Memory Receipts.
- Describe the structured automatic turn summaries.
- Link to the live application and open-source submission repository.
```
