# Senior Security Engineer & Production Constitution

This repository adheres to strict enterprise-grade security engineering standards. All application capabilities, data structures, authorization boundaries, secret management practices, and AI interactions must strictly comply with the following production directives:

## 1. Threat Modeling & Trust Boundaries
- **Untrusted Client Boundary**: The browser client is treated as completely untrusted. The browser must never directly interact with Cloud Firestore or the Gemini API using raw credentials.
- **Server-Mediated Architecture**: All state changes, model interactions, data queries, and deletions must be mediated by the authenticated backend.
- **Strict User Isolation**: User data is strictly structured under `users/{verifiedUid}/...`. The UID is NEVER accepted from request bodies, URL params, or untrusted input — it is exclusively derived on the server from cryptographically verified Firebase Authentication ID tokens.
- **Defense in Depth**: Firestore Security Rules explicitly deny all direct read and write access (`match /{document=**} { allow read, write: if false; }`), ensuring that any direct client bypass attempts fail closed.

## 2. Secure Secret & Cloud Identity Management
- **Zero Secrets in Code**: No API keys, service account JSON files, or private credentials exist in client source code, `VITE_` variables, frontend bundles, logs, or git repositories.
- **Runtime Injection**: The Gemini API key is accessed strictly server-side via `process.env.GEMINI_API_KEY`, injected at runtime via Google Cloud Secret Manager.
- **Least Privilege Execution**: Backend operations use Application Default Credentials (ADC) and dedicated runtime service accounts limited to necessary IAM roles.

## 3. Gemini Boundary & Untrusted Content Handling
- **Prompt Injection Defense**: All user journal text, prior conversation history, and memory excerpts are treated as untrusted data.
- **Context Bounding**: Input payload sizes, conversation history length, and memory excerpts are strictly bounded (e.g. 4,000 characters per message, bounded message windows).
- **Redacted Operational Logs**: Raw prompts, model outputs, personal reflections, and authentication tokens are strictly stripped from server logging to prevent data leakage.
- **Output Sanitization**: Model replies are rendered cleanly as structured text with strict React escaping, never via raw `innerHTML`.

## 4. Consistent & Atomic Persistence
- **Idempotent Turn Processing**: Client-generated idempotency IDs (`turnId`) ensure network retries do not duplicate journal entries or model turns.
- **Atomic Commits**: Turns and automatic summaries are committed atomically using Firestore transactions/batches to prevent partial state corruption.
- **Ephemeral Zero-Data Guarantee**: Ephemeral reflection mode executes model inference without writing turns, messages, or summaries to Firestore.
- **Verified Cascading Deletion**: Deleting a journal recursively deletes all sub-collection messages, transactions, and summaries with complete verification.

## 5. Privacy & Web Security Headers
- **Cache Prevention**: Authenticated API routes emit `Cache-Control: private, no-store`, `Pragma: no-cache`, and `Vary: Authorization`.
- **Cross-Site Defenses**: Content Security Policy (CSP), anti-clickjacking headers, and `Referrer-Policy: no-referrer` are enforced.
