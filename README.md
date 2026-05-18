# Car-Deal-Coach

An AI buyer's agent for first-time car shoppers. Helps the buyer evaluate a dealer offer mid-negotiation and produces a counter-offer script — with reasoning — they can read out loud to the dealer.

**Status:** in development. v0.1 ship target: **Sunday, June 28, 2026**.

**Full project plan:** see [PLAN.md](./PLAN.md).

---

## What it does

A first-time car buyer pastes a dealer offer (price, fees, APR, add-ons) and 3–5 comparable listings they found online. The app responds with:

- A 1–2 line **verdict card** ("Verdict: deal is 8% above target. Push for $XXXX OTD.")
- A **counter-offer script** in hedged, non-confrontational language
- **Per-line reasoning** tied to the buyer's pasted comps
- Callouts for known **dealer manipulation patterns** (the four-square, monthly-payment shuffle, F&I add-on scams)

The app never invents facts. It uses only the buyer's pasted comps and general-knowledge norms (state doc-fee caps, APR ranges, add-on price red flags) — no scraping, no paid pricing APIs.

## Why it exists

This is a **build-to-learn** project: the goal is to walk the full lifecycle of a modern web app (requirements → coding → testing → deploy → live) using AI as a pair-programmer. The car-buying use case is grounded in real personal experience — see PLAN.md for the full motivation, pre-mortem, and risk mitigations.

## Tech

Next.js + TypeScript + Vercel + Claude Sonnet API. No accounts, no database, no server-side state in v0.1 — browser `localStorage` only.

## Plan and scope

See [PLAN.md](./PLAN.md) for the full v0.1 scope contract, build phases, kill criteria, and explicit out-of-scope list. New ideas that arrive mid-build are captured in [ideas-for-later.md](./ideas-for-later.md), not pulled into v0.1.