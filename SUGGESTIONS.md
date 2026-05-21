# SUGGESTIONS — post-v0.1-scaffold polish & follow-ups

Audit run 2026-05-20 after Phase 1–4 scaffold landed (verdict card, script, reasoning, comps, walk-away gate, no-comps fallback, multi-round localStorage, manipulation callouts, theme toggle).

Three lists below:

- **A. v0.1 polish** — inside the PLAN.md hard scope gate; safe to do before friends see it.
- **B. Post-v0.1, scope-gated** — explicitly forbidden by PLAN.md scope contract until v0.1 ships + passes 5-deals test. Listed so we don't pretend they don't exist; not for now.
- **C. Developer / quality tooling** — not user-facing; supports the "follow web dev standards" goal.
- **D. Pre-deploy readiness** — needed before Phase 5 Vercel push.

Each entry: **Why → Steps → Files → Effort (S=<30min, M=30–120min, L=>2h)**.

---

## A. v0.1 polish (in scope)

### A1. Copy-to-clipboard on every script line  ·  Effort: S
- **Why:** The buyer reads the script off their phone in the F&I office. Tapping a "copy" button lets them paste a line into Notes/Messages or hold for TTS. Pure UX win.
- **Steps:**
  1. Add a small `<CopyButton text="…" />` component (uses `navigator.clipboard.writeText` with a fallback `<textarea>` for non-https local dev).
  2. Render one next to each line in `OutputCard.tsx`.
  3. Also render a "Copy entire script" button at the bottom of the script card that joins lines with `\n\n`.
  4. Brief visual confirmation (2-second "Copied" label swap).
- **Files:** `src/components/CopyButton.tsx` (new), `src/components/OutputCard.tsx` (edit).

### A2. Streaming responses from `/api/chat`  ·  Effort: M
- **Why:** First call takes 5–10s. Right now the user sees a disabled button and nothing else. Streaming the tool-use partial JSON (or at least a status indicator like "drafting verdict…", "writing script…") fixes the "is it broken?" feeling on a flaky F&I-office wifi.
- **Steps:**
  1. Switch route handler to `client.messages.stream(...)` and return a `ReadableStream` (Server-Sent Events or NDJSON).
  2. On the client, replace `fetch().then(json)` with a streaming reader.
  3. Render incremental status in the spot currently showing "Thinking…".
  4. On stream end, parse the final tool-use input and commit to the round.
  5. Handle abort: cancel the stream if the user clicks "Cancel".
- **Files:** `src/app/api/chat/route.ts`, `src/app/page.tsx`, new `src/lib/stream.ts` helper.

### A3. Demo / seed deal button  ·  Effort: S
- **Why:** First-load is empty and intimidating. A "Try with a sample deal" button pre-fills the Honda Odyssey scenario from PLAN.md so the user can see what the output looks like before pasting their own.
- **Steps:**
  1. Add `src/lib/sampleDeal.ts` exporting one realistic deal text + 3 comp strings + a sample walk-away number.
  2. Add a small "Load sample deal" link below `DealInput` (only visible when there are no comps and no walk-away set).
  3. Clicking it populates the gate, comps, and deal-text input fields (no auto-submit — user clicks Generate).
- **Files:** `src/lib/sampleDeal.ts` (new), `src/app/page.tsx` (edit).

### A4. Mobile UX polish  ·  Effort: M
- **Why:** Plan says use case is phone-only in the F&I office. Current layout is functional but not phone-first. Specifics:
  - iOS zooms when textarea font < 16px (it currently uses `text-sm` = 14px).
  - Submit button hidden below the fold once history grows.
  - Tap targets in `CompsInput` "Remove" link are <44px.
- **Steps:**
  1. Bump deal-input textarea to `text-base` (16px) for iOS-zoom prevention; keep label `text-sm`.
  2. Add sticky-on-mobile "Generate" submit bar at bottom of viewport when scrolled past the deal input.
  3. Increase tap-target padding on Remove / Edit links to ≥44px square.
  4. Test on Safari mobile emulation + real iPhone if available.
- **Files:** `src/components/DealInput.tsx`, `src/components/CompsInput.tsx`, `src/components/WalkAwayGate.tsx`, `src/app/page.tsx`.

### A5. Per-round Regenerate button  ·  Effort: S
- **Why:** Model is non-deterministic. If a script line lands awkwardly, the user wants a re-roll without re-typing the offer.
- **Steps:**
  1. Add a "Regenerate" button on each round card in `RoundHistory.tsx`.
  2. On click, call `/api/chat` with the same `userMessage` + same `context` + prior rounds *up to but not including this one*.
  3. Replace the round's `output` in place (don't append a new round).
- **Files:** `src/components/RoundHistory.tsx`, `src/app/page.tsx`, possibly extract a `useGenerate(round, …)` hook.

### A6. Server-side schema validation of model output  ·  Effort: S
- **Why:** Right now we cast `toolUse.input as CoachOutput`. If Claude returns a malformed shape (e.g. missing `scriptLines`), the UI will crash inside `.map()`. Cheap defense: validate before returning.
- **Steps:**
  1. Add `zod` (small, well-known).
  2. Define a `coachOutputSchema` mirroring the tool's `input_schema`.
  3. In the route handler, run `coachOutputSchema.safeParse(toolUse.input)`. On failure, return `{ ok: false, error: "Model output failed validation: …" }` so the UI shows a clean error instead of crashing.
- **Files:** `src/lib/types.ts` (add schema), `src/app/api/chat/route.ts` (use it), `package.json` (add `zod`).

### A7. Cmd+Enter / Ctrl+Enter to submit  ·  Effort: S
- **Why:** Standard chat-app keyboard ergonomic. Reduces friction on desktop testing.
- **Steps:** In `DealInput.tsx`, add an `onKeyDown` that fires submit when `(e.metaKey || e.ctrlKey) && e.key === 'Enter'`.
- **Files:** `src/components/DealInput.tsx`.

### A8. Inline edit of walk-away and comps from later rounds  ·  Effort: S
- **Why:** Buyer realizes mid-negotiation their walk-away was wrong, or they finally paste comps after starting in no-comps mode. They shouldn't lose history.
- **Steps:** Already partially supported (Edit button on `WalkAwayGate`). Verify it survives after rounds exist; add a one-line note in the UI: "Changes apply to your next round, not past rounds."
- **Files:** `src/components/WalkAwayGate.tsx`, `src/app/page.tsx`.

### A9. Error retry button  ·  Effort: S
- **Why:** When `/api/chat` 502s (e.g. transient Anthropic outage, rate limit), user has to retype/re-submit. Add a "Try again" button next to the inline error in `RoundHistory`.
- **Steps:** Reuse the regenerate path from A5; render a button only when `round.error && !round.output`.
- **Files:** `src/components/RoundHistory.tsx`.

### A10. Accessibility pass  ·  Effort: M
- **Why:** Plan emphasizes use-it-on-a-phone-in-a-stressful-moment. Screen-reader / keyboard support matters when the user is tired.
- **Steps:**
  1. Run axe-core or Lighthouse audit.
  2. Add `aria-live="polite"` to the script output container so new rounds get announced.
  3. Ensure focus ring on every interactive element (Tailwind `focus-visible:ring`).
  4. Check contrast on amber / emerald / red banners in both themes.
- **Files:** all components.

### A11. Better page metadata (OG image, favicon)  ·  Effort: S
- **Why:** Friends will see the link previewed in iMessage / Slack. Default Next favicon + no OG card looks unfinished.
- **Steps:**
  1. Replace `src/app/favicon.ico` with a custom one (a simple monogram).
  2. Add `src/app/opengraph-image.tsx` returning a 1200×630 generated image with title + tagline.
  3. Test OG preview at `https://www.opengraph.xyz/`.
- **Files:** `src/app/favicon.ico`, `src/app/opengraph-image.tsx` (new).

---

## B. Post-v0.1, scope-gated (DO NOT do until v0.1 ships + passes 5-deals test)

These are listed in PLAN.md's "Out of scope" block. Hard scope gate forbids pulling them into v0.1. They live here so we don't forget and so they don't sneak in disguised as polish.

- **B1. Voice input for the buyer** (already in `ideas-for-later.md`).
- **B2. Worst-case framing side panel** — explicitly deferred per PLAN.md "Trust signals". Add only if trust gap is observed in real friend use.
- **B3. User accounts & server-side persistence** — replaces localStorage. Requires DB choice, auth, GDPR posture.
- **B4. Cross-device session sync** — depends on B3.
- **B5. Mobile-first PWA / install prompt** — would let buyer launch from home screen offline. Defer.
- **B6. Photo / OCR input of paperwork** — buyer snaps the four-square sheet; we OCR it.
- **B7. Listing URL ingestion** — paste a Cars.com URL and we parse it server-side. Plan forbids scraping in v0.1.
- **B8. Multi-voice / aggressiveness toggles** — explicitly forbidden by PLAN.md (voice stays consistent coach).
- **B9. Paid pricing APIs (KBB / Edmunds / MarketCheck / vAuto)** — forbidden v0.1.
- **B10. v2 logging infrastructure for soft-signal kill criterion** — required for the 5%-out-of-bounds kill rule. Per plan, needs real users first.

---

## C. Developer / quality tooling

These match the "follow web dev standards" intent. None are scope-gated by PLAN.md.

### C1. ESLint + lint script  ·  Effort: S
- **Why:** `package.json` currently has no `lint` script. Next.js 16 ships with a built-in ESLint config.
- **Steps:**
  1. `npm i -D eslint eslint-config-next`
  2. Add `.eslintrc.json` extending `next/core-web-vitals`.
  3. Add `"lint": "next lint"` to `package.json` scripts.
  4. Run, fix any findings.
- **Files:** `package.json`, `.eslintrc.json` (new).

### C2. Prettier  ·  Effort: S
- **Why:** Consistent formatting; one less argument with future-you.
- **Steps:**
  1. `npm i -D prettier eslint-config-prettier`
  2. Add `.prettierrc.json` (`{ "semi": true, "singleQuote": true, "trailingComma": "all" }`).
  3. Add `"format": "prettier --write ."` script.
- **Files:** `package.json`, `.prettierrc.json` (new), `.prettierignore` (new).

### C3. Unit tests (Vitest)  ·  Effort: M
- **Why:** `lib/storage.ts`, `lib/theme.ts`, and the `/api/chat` request-builder logic are pure and easy to cover. Catches regressions in JSON shape and round-history serialization — the spots most likely to break silently.
- **Steps:**
  1. `npm i -D vitest @vitest/ui happy-dom @testing-library/react @testing-library/jest-dom`
  2. Add `vitest.config.ts` with happy-dom env.
  3. Write tests for: `loadSession` versioning, `resolveTheme`, `buildUserContent` with/without comps + walk-away.
  4. Add `"test": "vitest"` script.
- **Files:** `vitest.config.ts` (new), `src/**/*.test.ts` (new), `package.json`.

### C4. End-to-end test (Playwright)  ·  Effort: M
- **Why:** Manual smoke is brittle. One Playwright test that fills the gate, pastes a deal, intercepts `/api/chat` with a canned response, and asserts the verdict card renders catches the kind of "broke the wiring" bugs that escape unit tests.
- **Steps:**
  1. `npm i -D @playwright/test && npx playwright install`
  2. Add `playwright.config.ts` pointing at `http://localhost:3000`.
  3. Write `e2e/happy-path.spec.ts` with one full flow.
  4. Add `"e2e": "playwright test"` script.
- **Files:** `playwright.config.ts`, `e2e/happy-path.spec.ts`, `package.json`.

### C5. Pre-commit hook (husky + lint-staged)  ·  Effort: S
- **Why:** Stops broken-build commits from happening locally. Adds 2 seconds to commits but kills a class of "oops" pushes.
- **Steps:**
  1. `npm i -D husky lint-staged`
  2. `npx husky init`
  3. In `.husky/pre-commit` run `npx lint-staged`.
  4. In `package.json` add `"lint-staged": { "*.{ts,tsx}": ["eslint --fix", "prettier --write"] }`.
- **Files:** `.husky/pre-commit`, `package.json`.

### C6. GitHub Actions CI  ·  Effort: S
- **Why:** Same checks as pre-commit, run on every push. Vercel will also do this but slower; GA gives faster fail signal.
- **Steps:**
  1. Add `.github/workflows/ci.yml` running `npm ci`, `npm run lint`, `npm run build`, `npm test`.
  2. Pin Node to 20.x.
- **Files:** `.github/workflows/ci.yml` (new).

---

## D. Pre-deploy readiness (do these before Phase 5 Vercel push)

### D1. Vercel project + env vars  ·  Effort: S
- **Why:** Phase 5 requires a live URL. Without `ANTHROPIC_API_KEY` set in Vercel project env, the deploy is dead on arrival.
- **Steps:**
  1. `vercel link` from project root, or import via Vercel dashboard.
  2. Add `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) to Vercel project → Settings → Environment Variables. Tag for Production, Preview, Development.
  3. First push triggers a build; verify `/api/chat` works on the deploy URL.
- **Files:** none (Vercel dashboard config).

### D2. API rate limit  ·  Effort: M
- **Why:** Public URL = anyone hits `/api/chat`. Single curl loop drains the $30 monthly Anthropic budget. Per PLAN.md, budget overrun is supposed to trigger caching, not raise the cap — meaning we need a guard so the alarm rings before the budget dies.
- **Steps:**
  1. Add `@upstash/ratelimit` + `@upstash/redis` (free tier covers this).
  2. In the route handler, key by IP (`request.headers.get('x-forwarded-for')`) and limit to e.g. 20 req / hour.
  3. Return 429 with `{ok: false, error: "Rate limit hit. Try again in a few minutes."}` when over.
- **Files:** `src/app/api/chat/route.ts`, `package.json`, `.env.local.example` (add Upstash vars).

### D3. Token & spend logging  ·  Effort: S
- **Why:** Need a way to actually watch the $30/month cap. Vercel logs the response, but Anthropic returns usage in `response.usage` — log it.
- **Steps:**
  1. After the `messages.create` call, log `{ model, input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens }` to console (Vercel captures these).
  2. Optional: monthly tally script (out of scope, but the per-request log is enough to hand-sum).
- **Files:** `src/app/api/chat/route.ts`.

### D4. Error reporting (Sentry-lite)  ·  Effort: M
- **Why:** When the friends hit a bug, you want to know without them telling you. Even just console-level browser errors going to a log endpoint.
- **Steps:** Either set up Sentry's Next.js integration (heavy) OR a 20-line `/api/error` POST handler the client calls from a global error boundary. Defer if Sentry feels like too much.
- **Files:** `src/app/api/error/route.ts` (new), `src/app/error.tsx` (new).

### D5. Robots / noindex during testing  ·  Effort: S
- **Why:** Don't want this indexed before it works. v0.1 is friends-only.
- **Steps:** Add `src/app/robots.ts` returning `{ rules: [{ userAgent: '*', disallow: '/' }] }`. Remove when comfortable making it public.
- **Files:** `src/app/robots.ts` (new).

---

## Recommended order

If you want a single batch to do before friends see it:

1. **A6** (zod validation) — defensive, 20 min.
2. **A1** (copy buttons) — best UX-per-minute payoff.
3. **A2** (streaming) — biggest perceived-quality jump.
4. **A4** (mobile polish) — required for the actual use moment.
5. **A11** (favicon + OG) — link-preview presentability.
6. **C1 + C2 + C5** (lint + format + pre-commit) — bundle, one sitting.
7. **D1 + D3** (Vercel deploy + token logging) — gets to "live URL".
8. **D2** (rate limit) — before sharing the URL with anyone outside the test pair.
9. Run the **5-personal-deals test** (Phase 5 in PLAN.md).
10. Open up to Homayoon + Khalid.

Everything in **B** stays out of v0.1 until the 5-deals test passes.
