# Car-Deal-Coach

## Elevator Pitch

Car-Deal-Coach is a free-text + chat web app that helps a first-time car buyer evaluate a dealer offer mid-negotiation and produces a counter-offer script they can read out loud. The primary motivation is build-to-learn: walking the full lifecycle of a modern web app (requirements → coding → testing → deploy → live) and proving I can use AI to ship real software. The Honda Odyssey $1,800 paint-protection scam is the personal scar that made this the chosen project over a hundred other ideas, and 2–3 friends buying cars in the next 12 months are the concrete external use case. This is explicitly **not** optimized as a sellable product.

---

## Product Specification

**Value.** Deal evaluator for a first-time car buyer. Input is a deal in the buyer's own words; output is a counter-offer script with a 1–2 line verdict card on top and per-line reasoning underneath.

**User.** First-time car buyer. Anxious, no benchmark, fears getting ripped off, low knowledge of fees and financing.

**Use moment.** Mid-negotiation breaks. Buyer steps out of the F&I office for 60 seconds to a few minutes, pastes the latest dealer offer on their phone, gets the next counter, returns. Phone-only context, in or near the dealership.

**Input.** Free text + chat. User pastes/describes the deal in their own words; assistant asks follow-ups. Buyer also pastes 3–5 comparable listings they found online (Cars.com / AutoTrader / CarGurus).

**Output.** Counter-offer script (main deliverable) + 1–2 line verdict card at top (e.g. "Verdict: deal is 8% above target. Push for $XXXX OTD.") + one-line reasoning paired with every script line, tied to the buyer's pasted comps.

**Truth source.** Hybrid:
- **Primary:** 3–5 comparable listings the user pastes.
- **Augment:** LLM general knowledge for APR ranges, doc-fee norms by state, and add-on red flags.
- **No scraping. No paid pricing APIs (KBB / Edmunds / MarketCheck) in v0.1.**
- **No-comps fallback:** App coaches the buyer to stall and pre-fills search URLs for Cars.com / AutoTrader / CarGurus. Only if the buyer truly can't leave the room, the app runs LLM-only with a prominent low-confidence warning at the top of the output.

**Script ethics.** The script never invents facts the buyer could be called out on. No fabricated competing offers. No vague-true bluffs ("I've been comparing other listings"). Specific-true only ("per the three listings I pasted at $40,800 average, can we get OTD closer to that number?"). The app surfaces dealer-side manipulation patterns (four-square, monthly-payment shuffle) so the user recognizes them — it does not teach the buyer to deploy lies. Voice is a consistent coach; no aggression toggles.

**Trust signals** (in v0.1): every script line is paired with one-line reasoning tied to the user's pasted comps; the system prompt enforces non-confrontational hedged phrasing; a walk-away pre-commit input gate asks the buyer for the OTD price above which they'll walk away, and that number is anchored back into the script as the buyer's own. A worst-case framing side panel is deferred until trust gap is observed in real use.

---

## v0.1 Scope Contract

**Hard scope gate (from pre-mortem countermeasure):** nothing not listed below is allowed into v0.1. New ideas go to `ideas-for-later.md` and stay there until v0.1 passes the 5-personal-deals test.

### In scope for v0.1

- Single-page chat UI on web.
- Free-text + chat input flow.
- Counter-offer script as main output + 1–2 line verdict card on top + per-line reasoning.
- User pastes 3–5 comparable listings as primary truth source.
- LLM general-knowledge augment for APR ranges, state doc-fee norms, add-on red flags.
- No-comps fallback: coach to stall + pre-filled search URLs; LLM-only mode with prominent low-confidence warning.
- Hedged non-confrontational voice enforced via system prompt.
- Walk-away pre-commit input gate before script generation.
- Math/reasoning paired with every script line.
- LocalStorage for cross-round session memory within a single browser tab.
- Dealer-side manipulation pattern callouts (four-square, monthly-payment shuffle, etc.) when relevant.

### Out of scope until v0.1 ships and passes the 5-personal-deals test

- Worst-case framing side panel.
- User accounts.
- Server-side persistence / database.
- Cross-device session sync.
- Mobile-first PWA / install.
- Voice input.
- Paid pricing APIs (KBB / Edmunds / MarketCheck / vAuto).
- Any scraping.
- Photo / OCR input of paperwork.
- Listing URL ingestion.
- Multi-voice / aggressiveness toggles.
- v2 logging infrastructure for soft-signal kill criterion.

---

## Build Phases

Phase 1 must be the smallest thing that runs. Phase 5 must be the 5-personal-deals test + Vercel deploy.

### Phase 1 — Smallest thing that runs

- **Goal:** A deployed Next.js + TypeScript app on Vercel that takes a typed message and returns a Claude Sonnet response.
- **What gets built:** Scaffold a Next.js + TS project. One chat input. One serverless API route calling Anthropic API with Claude Sonnet. Hardcoded placeholder system prompt. Connect repo to Vercel; first push lives at a real URL.
- **Definition of done:** I can open the live Vercel URL on my phone, type "hello", and see a Claude Sonnet reply.
- **Commits:** scaffold project; add chat input; add API route; wire to Anthropic API; deploy to Vercel.

### Phase 2 — Real system prompt + script output shape

- **Goal:** Output is in the actual product format: verdict card + counter-offer script + per-line reasoning.
- **What gets built:** Write the system prompt enforcing hedged coach voice, "never invent facts," verdict-card-then-script-then-reasoning structure, and specific-true comp-anchored phrasing. Render structured output in the chat UI.
- **Definition of done:** I paste a real Honda Odyssey-style deal + 3 comps; output comes back in the verdict + script + reasoning shape with hedged language.
- **Commits:** add system prompt; add output renderer; iterate prompt against 1–2 sample deals.

### Phase 3 — Inputs that match the product spec

- **Goal:** The walk-away pre-commit gate, the comps paste flow, and the no-comps fallback all work.
- **What gets built:** Pre-script walk-away OTD input gate (anchored into output). Comps paste field accepting 3–5 listings. No-comps path: app coaches stall + shows pre-filled search URLs for Cars.com / AutoTrader / CarGurus. LLM-only fallback with prominent low-confidence warning at top of output.
- **Definition of done:** All three flows reachable from the UI; walk-away number appears anchored in the script; low-confidence warning is unmistakable in the LLM-only path.
- **Commits:** walk-away gate; comps field; no-comps URL hints; LLM-only warning banner.

### Phase 4 — Multi-round session memory + dealer-pattern callouts

- **Goal:** Buyer can paste follow-up dealer counters across breaks; app remembers prior context within the tab. App calls out dealer-side manipulation patterns when relevant.
- **What gets built:** LocalStorage cross-round memory of prior offer and prior recommendation. Prompt additions for surfacing four-square, monthly-payment shuffle, and similar tactics when the dealer offer matches the pattern.
- **Definition of done:** I can do a 3-round simulated negotiation on my phone, close the tab, reopen it, and the session resumes. Pattern callouts fire on at least one constructed dealer offer.
- **Commits:** localStorage round memory; restore on reload; pattern callout prompt rules.

### Phase 5 — 5-personal-deals test + ship

- **Goal:** Run the hard kill criterion. Deploy publicly to the friends.
- **What gets built:** Test the app against 5 deals I already know the right answer for (my own past deals + 2–3 friends' deals). Look for any single recommendation that would have cost the buyer >$1,000 or insulted the dealer badly enough to kill the deal. If any one event fires, strip LLM-only mode and make comps mandatory before continuing.
- **Definition of done:** All 5 test deals produce recommendations that pass the >$1,000 / deal-killing bar. Live URL is shared with the 2 pre-committed friends.
- **Commits:** test-deal fixtures; prompt fixes from test findings; any rip-out of LLM-only mode if triggered; final deploy.

---

## Kill Criteria

Tiered. Not a single threshold.

### Hard kill (immediate action, any one event)

- **Trigger:** During the Phase 5 5-personal-deals test, the app produces a recommendation that would have cost the buyer >$1,000 **or** insulted the dealer badly enough that the deal would die — on any one of the 5 deals.
- **Action:** Remove LLM-only mode entirely. Make pasted comps mandatory before the script generates. No launch with LLM-only mode intact.
- **v1 with no users:** This is the only operational criterion. If any of the 5 personal/friend test deals fails badly, LLM-only mode comes out before friends ever see the URL.

### Soft signal (review and adjust, not kill)

- **Trigger:** Logged sessions show >5% of outputs producing numbers outside reasonable bounds (e.g. recommending a counter-offer below dealer invoice, or claiming a doc fee is illegal when it isn't).
- **Action:** Adjust prompts. Tighten guardrails.
- **Prerequisite:** Requires v2 logging infrastructure — explicitly out of scope for v0.1.

### User-reported (treated as data, not kill criterion)

- **Single report:** A friend says "the app's recommendation made the dealer walk away." Read the transcript, learn.
- **Pattern (multiple reports same shape):** Adjust prompts.
- **Repeated pattern after adjustment:** Strengthen comp-requirement; further restrict LLM-only path.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| **Novelty fade + scope creep (primary killer).** Weeks 1–2 exciting because everything new; by week 3 only practice remains and the brain whispers "wouldn't it be more interesting to add accounts/mobile/voice…" | Hard v0.1 scope gate. `ideas-for-later.md` for any new idea that arrives mid-build. Pre-committed weekly scope written every weekend; review misses before touching new ideas. Practice-as-learning reframe: shipping *is* the lesson. Tell 2 friends-buying-cars that v0.1 ships by a specific date — external accountability replaces fading novelty motivation. |
| **Wiring-up wall (secondary killer).** Boring infra — env vars, deployment, LLM API setup — stalls progress around week 2–3. | Deployment scheduled in Phase 1 (week 2–3), not week 6 — hit the boring infra wall while still energetic. Next.js + Vercel chosen specifically to one-click-deploy and remove this entire class of friction. |
| **LLM hallucinates state-specific fee norms / APR ranges / add-on prices.** | 5-personal-deals hard kill test before launch. Any single >$1,000 or deal-killing recommendation strips LLM-only mode and makes comps mandatory. |
| **Bluff slippage.** Vague-true ("I've been comparing other listings") slides into specific-false. | Flat policy in system prompt: never invent facts. Specific-true only. Surface dealer manipulation patterns instead of teaching buyer to deploy them. Voice stays consistent coach — no aggressiveness toggle. |
| **API budget overrun.** Build-to-learn but Anthropic API isn't free. Claude Max does **not** cover deployed-app API calls. | $30/month cap during v0.1 testing. If I blow through it, that's the signal to add caching / optimization before continuing — not raise the cap. |
| **Trust gap mid-negotiation.** Buyer doesn't trust the script enough to say it out loud. | Layered trust signals in v0.1: math paired with every line, hedged voice, walk-away pre-commit gate anchoring buyer's own number. Worst-case framing panel held in reserve and added only if the trust gap shows up in real friend use. |

---

## Tech Stack and Budget

- **Framework:** Next.js + TypeScript.
- **Hosting:** Vercel (free tier).
- **LLM:** Claude Sonnet via the Anthropic API directly.
- **Storage:** Browser `localStorage` only in v0.1. No DB. No server-side state. No accounts.
- **Budget cap:** $30 / month on Anthropic API during v0.1 testing. Overrun is a signal to add caching/optimization, not to raise the cap.
- **Claude Max ≠ deployed-app API.** Claude Max covers Claude Code and claude.ai; deployed-app Anthropic API calls bill separately and count against the $30 cap.

---

## Deliberately Deferred

Not in v0.1. Not blockers for shipping. Documented here so they don't sneak back in.

- **Friends-and-family delivery mechanism.** How the 2–3 friends-buying-cars actually access and remember to use v0.1 during their real deal (URL share, reminder timing, embarrassment-of-use friction) — not yet addressed.
- **v0.2 / v1 roadmap after the 5-deal test passes.** Explicitly deferred until v0.1 ships.
- **Server-side persistence migration trigger.** Defined as "if localStorage proves insufficient," but no specific signal named.
- **v2 logging infrastructure** for the 5%+ soft-signal kill criterion — postponed until real users exist.

---

## Notes

**Resolved before Phase 1 (commits forthcoming):**

- **Ship date for v0.1:** Sunday, June 28, 2026. This is the date told to Homayoon and Khalid for accountability. If I miss it, I look at *why* before I touch any deferred-list ideas.
- **Two friends to tell:** Homayoon and Khalid. They will get a test URL when v0.1 passes the 5-personal-deals test.
- **Weekly scope ritual:** Every Sunday at 8 PM. I write down what I'll have done by the *next* Sunday. If I missed the prior week's commitment, I look at why before adjusting the new week's scope.
- **`ideas-for-later.md` lives at repo root.** Already committed.

**Still TBD (deliberately):**

Things that came up during planning but were not explicitly committed to during the grilling — flagged here rather than invented into the spec:
- **What "deal" looks like as input schema.** The free-text + chat shape is committed, but no formal field list was committed. Phase 2 system-prompt work will need to define what shape the model expects (e.g. price, fees, APR, term, trade-in, taxes) even if the user types it free-form.
- **Whether Phase 5's "live URL shared with 2 friends" is a closed/invite-only link or just shared privately by URL.** Not discussed during grilling.
