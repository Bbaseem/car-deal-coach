'use client';

import { useState } from 'react';
import { CompsInput } from '@/components/CompsInput';
import { DealInput } from '@/components/DealInput';
import { RoundHistory } from '@/components/RoundHistory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WalkAwayGate } from '@/components/WalkAwayGate';
import { useSession } from '@/hooks/useSession';
import { SAMPLE_DEAL } from '@/lib/sampleDeal';
import type { ChatRequest, ChatResponse, Round } from '@/lib/types';

function makeRoundId() {
  return `round_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeCompId() {
  return `comp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function Home() {
  const {
    session,
    hydrated,
    setWalkAway,
    setComps,
    appendRound,
    updateRound,
    reset,
  } = useSession();
  const [pendingRoundId, setPendingRoundId] = useState<string | null>(null);
  const [topLevelError, setTopLevelError] = useState<string>('');

  async function runRound(round: Round, priorRounds: Round[]) {
    setTopLevelError('');
    setPendingRoundId(round.id);
    updateRound(round.id, { output: null, error: undefined });
    try {
      const body: ChatRequest = {
        message: round.userMessage,
        context: round.context,
        priorRounds,
      };
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: ChatResponse = await res.json();
      if (!data.ok) {
        updateRound(round.id, { error: data.error });
        setTopLevelError(data.error);
      } else {
        updateRound(round.id, { output: data.output, error: undefined });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed.';
      updateRound(round.id, { error: msg });
      setTopLevelError(msg);
    } finally {
      setPendingRoundId(null);
    }
  }

  async function generate(message: string) {
    const round: Round = {
      id: makeRoundId(),
      createdAt: Date.now(),
      userMessage: message,
      context: {
        walkAwayOtd: session.walkAwayOtd,
        dealText: message,
        comps: session.comps,
      },
      output: null,
    };
    appendRound(round);
    const priorRounds = session.rounds.filter((r) => r.output != null);
    await runRound(round, priorRounds);
  }

  async function regenerate(target: Round) {
    const idx = session.rounds.findIndex((r) => r.id === target.id);
    if (idx < 0) return;
    const priorRounds = session.rounds
      .slice(0, idx)
      .filter((r) => r.output != null);
    await runRound(target, priorRounds);
  }

  function loadSample() {
    setWalkAway(SAMPLE_DEAL.walkAwayOtd);
    setComps(SAMPLE_DEAL.comps.map((text) => ({ id: makeCompId(), text })));
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading session…
      </main>
    );
  }

  const canSubmit = pendingRoundId == null && session.walkAwayOtd != null;
  const isEmpty =
    session.walkAwayOtd == null && session.comps.length === 0 && session.rounds.length === 0;

  return (
    <main className="min-h-screen w-full max-w-3xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Car Deal Coach</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Paste a dealer offer. Get a hedged counter-offer script with per-line reasoning you can read out loud.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <ThemeToggle />
          {session.rounds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear walk-away, comps, and all rounds from this device?')) reset();
              }}
              className="text-xs underline text-gray-600 dark:text-gray-400 min-h-[28px]"
            >
              Reset session
            </button>
          )}
        </div>
      </header>

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-blue-400 bg-blue-50 dark:bg-blue-950/30 p-4 flex items-center justify-between gap-3">
          <div className="text-sm text-blue-900 dark:text-blue-200">
            First time here? Try a sample Honda Odyssey deal to see how the output looks.
          </div>
          <button
            type="button"
            onClick={loadSample}
            className="shrink-0 px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium min-h-[40px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Load sample
          </button>
        </div>
      )}

      <WalkAwayGate
        value={session.walkAwayOtd}
        onChange={setWalkAway}
        editNote={session.rounds.length > 0}
      />

      <CompsInput comps={session.comps} onChange={setComps} hasRounds={session.rounds.length > 0} />

      <section className="rounded-lg border border-gray-300 dark:border-gray-700 p-4">
        <DealInput disabled={!canSubmit} onSubmit={generate} />
        {!canSubmit && session.walkAwayOtd == null && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
            Set your walk-away OTD above before generating a script.
          </p>
        )}
      </section>

      {topLevelError && (
        <div
          role="alert"
          className="rounded border border-red-300 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 p-3 text-sm"
        >
          {topLevelError}
        </div>
      )}

      <RoundHistory
        rounds={session.rounds}
        pendingRoundId={pendingRoundId}
        onRegenerate={regenerate}
      />

      <footer className="text-xs text-gray-500 dark:text-gray-500 mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
        v0.1 · session stays on this device (localStorage) · no accounts, no server storage
      </footer>
    </main>
  );
}
