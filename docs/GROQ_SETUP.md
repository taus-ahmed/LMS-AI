# Groq Setup Guide (LMS-AI)

This guide explains how to configure Groq API access for this project without committing secrets.

---

## 1) Prerequisites

- Node.js installed (recommended LTS)
- npm installed
- Access to a Groq account and API keys
- This repository cloned locally

---

## 2) Where Groq Is Used

Groq calls are implemented in:

- `src/services/aiService.ts`

The service reads your key from the Vite environment variable:

- `VITE_GROQ_API_KEY`

If that variable is missing, the app throws:

- `Missing Groq API key. Set VITE_GROQ_API_KEY in your environment.`

---

## 3) Create a Groq API Key

1. Sign in to Groq Console.
2. Open API Keys.
3. Create a new key.
4. Copy the key immediately.

Security note:

- Treat the key like a password.
- Never commit it to Git.
- Rotate it immediately if exposed.

---

## 4) Add Local Environment Variables

Create a `.env` file in the project root (`F:\LMS-AI`).

Example:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

Optional overrides (if you later add support):

```env
# Example only
# VITE_GROQ_MODEL=llama-3.3-70b-versatile
```

Important:

- Vite only exposes variables that start with `VITE_` to frontend code.
- Restart the dev server after changing `.env` values.

---

## 5) Confirm `.gitignore` Protection

This repo already ignores `node_modules`.
You should also ensure local env files are ignored.

Recommended entries in `.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

Then verify with:

```bash
git status
```

Your `.env` file should not appear in staged/unstaged changes.

---

## 6) Install and Run

From project root:

```bash
npm install
npm run dev
```

Open the app in the browser using the URL shown by Vite.

---

## 7) Quick Functional Test

1. Navigate to the Mentor/AI feature in the app.
2. Send a simple prompt (example: "Summarize my next milestone.").
3. Confirm you get a valid model response.

If successful, Groq integration is configured correctly.

---

## 8) Common Errors and Fixes

### Error: Missing Groq API key

Cause:
- `VITE_GROQ_API_KEY` is not set.

Fix:
- Add it to `.env`.
- Restart `npm run dev`.

### Error: 401 / Unauthorized

Cause:
- Invalid or revoked key.

Fix:
- Generate a new key in Groq Console.
- Replace local value in `.env`.
- Restart dev server.

### Error: 429 / Rate limit

Cause:
- Too many requests.

Fix:
- Retry later.
- Reduce request frequency or token usage.

### Error: 5xx from provider

Cause:
- Temporary upstream issue.

Fix:
- Retry with backoff.
- Check Groq status page.

---

## 9) Security Checklist

- Do not hardcode keys in `src/` files.
- Keep secrets only in local `.env` or deployment secrets manager.
- Use different keys for local/dev/prod.
- Rotate keys on team member changes.
- If a key is leaked, revoke and replace immediately.

---

## 10) Deployment Notes

For hosted environments, configure `VITE_GROQ_API_KEY` in your hosting provider’s environment settings (not in source control).

After setting env vars:

1. Redeploy/build.
2. Verify the AI feature works in production.

---

## 11) Recommended Team Workflow

- Keep `.env` local and private.
- Provide a sanitized `.env.example` for onboarding.
- Review pull requests for accidental secret commits.
- Enable GitHub secret scanning (already active in this repo).

---

## 12) Incident Recovery (If Key Was Pushed)

1. Revoke compromised key immediately in Groq Console.
2. Create a new key.
3. Remove secret from code.
4. Rewrite Git history to remove leaked key commit.
5. Force-push cleaned history.
6. Verify push protection passes.

---

If you want, add a `docs/DEPLOYMENT_ENV.md` next to this file for production environment setup conventions.