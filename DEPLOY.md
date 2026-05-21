# DEPLOY.md — Vercel setup for Car-Deal-Coach v0.1

Phase 5 in PLAN.md needs a live URL. This is the one-time setup; subsequent deploys happen automatically on every push to `main` (or per-branch preview deploys for PRs).

---

## 1. Link the repo to Vercel

Pick one:

**A. Vercel dashboard (recommended for first time)**

1. Open https://vercel.com/new.
2. Import this Git repository.
3. Framework preset: **Next.js** (auto-detected).
4. Root directory: leave at default.
5. Build & output settings: leave at defaults (`npm run build` / `.next`).
6. Don't deploy yet — click **Environment Variables** first (next section).

**B. From the CLI**

```bash
npm i -g vercel
vercel link
```

This creates `.vercel/` (already in `.gitignore`). Then run `vercel env pull .env.local` after step 2 to sync env vars locally.

---

## 2. Environment variables

Set in Vercel dashboard → Project → **Settings → Environment Variables**. Tag each for **Production**, **Preview**, and **Development** unless noted otherwise.

| Name                       | Required | Value                                    | Notes |
| -------------------------- | -------- | ---------------------------------------- | ----- |
| `ANTHROPIC_API_KEY`        | **Yes**  | `sk-ant-...`                             | From https://console.anthropic.com/settings/keys. Server-only. |
| `ANTHROPIC_MODEL`          | No       | `claude-sonnet-4-5`                      | Override default model if needed. |
| `NEXT_PUBLIC_SITE_URL`     | Yes      | `https://<your-project>.vercel.app`      | Used by `metadataBase` for absolute OG/Twitter URLs. Must be set or social previews break. |
| `UPSTASH_REDIS_REST_URL`   | No       | `https://...upstash.io`                  | Enables `/api/chat` rate limiting. Without it the limiter no-ops. |
| `UPSTASH_REDIS_REST_TOKEN` | No       | `...`                                    | Pair with the URL above. |

> **Anthropic billing.** Claude Max does **not** cover deployed-app API calls — those bill against your Anthropic API account separately. PLAN.md caps v0.1 testing at $30/month; overrun is the signal to add caching, not raise the cap.

---

## 3. Deploy

Either:

- Push to `main` — Vercel deploys to production automatically.
- Open a PR — Vercel builds a preview URL per PR (visible as a comment).
- `vercel --prod` from the CLI for a manual production deploy.

---

## 4. Smoke-test the deploy

```bash
# Replace with your real URL.
SITE=https://your-deploy.vercel.app

# Home page should return 200 and contain the title.
curl -s "$SITE/" | grep -o "<title>[^<]*</title>"

# robots.txt is intentionally disallow-all during v0.1.
curl -s "$SITE/robots.txt"

# API smoke (no API key call — just validation).
curl -s -X POST "$SITE/api/chat" -H "Content-Type: application/json" -d '{}'
# → 400 {"ok":false,"error":"Message is required."}

# OG image renders.
curl -sI "$SITE/opengraph-image" | head -2
# → 200, content-type: image/png
```

Then open the site on your phone, set walk-away OTD → paste a deal → confirm streaming "Drafting verdict and script…" status appears and the script renders.

---

## 5. Watching token spend

Every successful `/api/chat` call logs:

```
[chat] { model, durationMs, input_tokens, output_tokens,
         cache_creation_input_tokens, cache_read_input_tokens }
```

In the Vercel dashboard:

- **Logs** tab: live tail.
- **Observability → Functions**: aggregated counts per minute.

Multiply tokens × Anthropic's published price to estimate spend. Cache-read tokens are billed at ~10% of normal input tokens.

---

## 6. Rolling back

Vercel dashboard → **Deployments** → click the previous successful one → **Promote to Production**. No git revert needed for emergencies; do the git revert afterwards to keep the source of truth.

---

## 7. When v0.1 ships (Phase 5)

1. Pass the 5-personal-deals test (PLAN.md kill criteria).
2. **Remove** `src/app/robots.ts` so search engines can index — only after you're comfortable making it public.
3. Share the URL with Homayoon and Khalid (the two pre-committed friends).

---

## 8. Useful links

- Vercel dashboard: https://vercel.com/dashboard
- Anthropic console (keys + usage): https://console.anthropic.com/
- Upstash console (rate limit Redis): https://console.upstash.com/
- Next.js 16 deployment docs: https://nextjs.org/docs/app/getting-started/deploying
