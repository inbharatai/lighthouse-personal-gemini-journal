# Claude Code Windows 11 Git Bash Cloud Handoff Prompt

Copy and paste the prompt below into Claude Code when running in Windows 11 Git Bash to execute the live cloud deployment and multi-account verification gates.

---

```text
Act as the senior production and cloud deployment auditor for Lighthouse.

OPERATING ENVIRONMENT RULES:
1. Environment: Windows 11 Git Bash.
2. Use 'python', NOT 'python3'.
3. Avoid 'pkill'; use 'taskkill //F //PID <PID>' when terminating background processes.
4. Never prompt the user to paste secrets, API keys, or credentials into chat.
5. Require user interaction for Google Cloud login, MFA, OAuth consent, Secret Manager key entry, and deployment confirmation.

EXECUTION GATES TO AUDIT & REPORT:
1. CLEAN INSTALL & AUDIT:
   - Run 'npm ci'
   - Run 'npm audit' and 'npm audit --omit=dev'
   - Run 'npm run check' (lint + tests + build)

2. FIREBASE EMULATOR TESTS:
   - If Java and Firebase CLI are installed:
     Run 'npm run test:emulator'
   - Record results (PASS, FAIL, or PENDING).

3. SECRET MANAGER & CLOUD RUN DEPLOYMENT:
   - Guide user to create Secret Manager secret 'lighthouse-gemini-api-key' in Google Cloud Console.
   - Verify public Firebase Web config is exported in shell.
   - Run 'sh scripts/deploy.sh'.
   - Validate that deny-all Firestore rules deployed BEFORE Cloud Run.
   - Validate Cloud Run service account 'lighthouse-runtime' has least-privilege roles only.

4. TWO-ACCOUNT ISOLATION PROBES (ON DEPLOYED CLOUD RUN URL):
   - Sign in with User A: Create 'Alice Journal', hold 2 turns, observe Memory Receipt & Automatic Summary.
   - Sign in with User B in incognito: Verify User A's journal is not listed.
   - User B attempts direct URL access to User A's journal ID -> Confirm HTTP 404.
   - User B attempts Memory Lens cross-journal access -> Confirm User A's memory is excluded.
   - User A tests Ephemeral Reflection -> Confirm zero Firestore writes in Console.
   - User A exports journal and deletes it -> Confirm recursive deletion of document and descendants.

5. SECURITY HEADERS & LOG SCAN:
   - Check deployed response headers: 'Cache-Control: private, no-store', 'Pragma: no-cache', 'Vary: Authorization', 'x-content-type-options: nosniff'.
   - Scan Cloud Logging to verify NO raw prompts, user text, model replies, or tokens are logged.

Report all results in a clear table marking each check as PASS, FAIL, or PENDING with matching execution evidence.
```
