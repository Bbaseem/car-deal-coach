# Car-Deal-Coach

An AI buyer's agent for first-time car shoppers. Helps the buyer evaluate a dealer offer mid-negotiation and produces a counter-offer script — with reasoning — they can read out loud to the dealer.

**Status:** v0.1 feature-complete, pending Phase 5 (5-personal-deals test + Vercel deploy). Ship target: **Sunday, June 28, 2026**.

**Full project plan:** see [PLAN.md](./PLAN.md).
**Post-v0.1 polish + scope-gated ideas:** see [SUGGESTIONS.md](./SUGGESTIONS.md).
**Deploy guide:** see [DEPLOY.md](./DEPLOY.md).

---

## What it does

A first-time car buyer pastes a dealer offer (price, fees, APR, add-ons) and 3–5 comparable listings they found online. The app responds with:

- A 1–2 line **verdict card** ("Verdict: deal is 8% above target. Push for $XXXX OTD.")
- A **counter-offer script** in hedged, non-confrontational language
- **Per-line reasoning** tied to the buyer's pasted comps
- Callouts for known **dealer manipulation patterns** (the four-square, monthly-payment shuffle, F&I add-on scams)
- A **low-confidence fallback** when no comps are pasted: stall script + pre-filled Cars.com / AutoTrader / CarGurus search URLs

The app never invents facts. It uses only the buyer's pasted comps and general-knowledge norms (state doc-fee caps, APR ranges, add-on price red flags) — no scraping, no paid pricing APIs.

## Why it exists

This is a **build-to-learn** project: the goal is to walk the full lifecycle of a modern web app (requirements → coding → testing → deploy → live) using AI as a pair-programmer. The car-buying use case is grounded in real personal experience — see PLAN.md for the full motivation, pre-mortem, and risk mitigations.

## Tech

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4 with class-based light/dark/auto theme
- **LLM:** Pluggable provider — **Anthropic Claude** or **OpenAI GPT** — selected by `LLM_PROVIDER` env (auto-detect from whichever key is set). Structured output via forced `tool_use` / function calling, NDJSON streaming with live progress.
- **Validation:** Zod schema on every model response
- **Storage:** Browser `localStorage` only (no DB, no accounts, no server-side state in v0.1)
- **Optional rate limit:** Upstash Redis sliding-window (no-op when env unset)
- **Tooling:** ESLint 9 flat config, Prettier, Vitest + happy-dom, Playwright runner, husky + lint-staged, GitHub Actions CI

## Getting started

```bash
# 1. clone + install
npm install

# 2. add ONE provider key (server-only): Anthropic OR OpenAI
cp .env.local.example .env.local
# edit .env.local — set ANTHROPIC_API_KEY (https://console.anthropic.com/settings/keys)
# or set OPENAI_API_KEY (https://platform.openai.com/api-keys). You can set both
# and pick which one to use with LLM_PROVIDER=openai|anthropic|auto.

# 3. dev
npm run dev   # http://localhost:3000
```

### Useful scripts

| Command              | What it does                                                    |
| -------------------- | --------------------------------------------------------------- |
| `npm run dev`        | Next.js dev server on :3000                                     |
| `npm run build`      | Production build + TS type-check                                |
| `npm start`          | Run the production build                                        |
| `npm run lint`       | ESLint flat config across the repo                              |
| `npm run lint:fix`   | ESLint with `--fix`                                             |
| `npm run format`     | Prettier write-all                                              |
| `npm run format:check` | Prettier check-only (used by CI)                              |
| `npm test`           | Vitest unit tests (storage, theme, schema, prompt builder)      |
| `npm run test:watch` | Vitest in watch mode                                            |
| `npm run e2e:install` | One-time Playwright Chromium download (~150 MB)                |
| `npm run e2e`        | Playwright happy-path spec (stubs the API; no key needed)       |

### What's in a session

- **Walk-away OTD** — set first; anchored into every script as the buyer's own number
- **Comps (0–5)** — paste real listings; with zero comps the app enters low-confidence mode
- **Deal text** — free-text dealer offer; ⌘/Ctrl+Enter submits
- **Rounds** — each generation appended to localStorage; reopen the tab and the session resumes; per-round Regenerate / Retry

### Theme

Light / Dark / Auto toggle in the header. Stored in `localStorage` key `car-deal-coach:theme:v1`. Inline `<head>` script applies the class before first paint to avoid FOUC.

## Scope and follow-ups

PLAN.md hard scope gate is in effect for v0.1 — nothing not in its In Scope block is allowed in until the 5-personal-deals test passes. Polish items inside scope and out-of-scope items both live in [SUGGESTIONS.md](./SUGGESTIONS.md). New ideas that arrive mid-build go to [ideas-for-later.md](./ideas-for-later.md), not into v0.1.
