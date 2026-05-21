'use client';

import { useState } from 'react';
import { CompsInput } from '@/components/CompsInput';
import { DealInput } from '@/components/DealInput';
import { RoundHistory } from '@/components/RoundHistory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WalkAwayGate } from '@/components/WalkAwayGate';
import { useSession } from '@/hooks/useSession';
import type { ChatRequest, ChatResponse, Round } from '@/lib/types';

function makeRoundId() {
  return `round_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function Home() {
  const { session, hydrated, setWalkAway, setComps, appendRound, updateRound, reset } =
    useSession();
  const [pending, setPending] = useState(false);
  const [topLevelError, setTopLevelError] = useState<string>('');

  async function generate(message: string) {
    setTopLevelError('');
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
    setPending(true);
    try {
      const body: ChatRequest = {
        message,
        context: round.context,
        priorRounds: session.rounds.filter((r) => r.output != null),
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
        updateRound(round.id, { output: data.output });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed.';
      updateRound(round.id, { error: msg });
      setTopLevelError(msg);
    } finally {
      setPending(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading session…
      </main>
    );
  }

  const canSubmit = !pending && session.walkAwayOtd != null;

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
              className="text-xs underline text-gray-600 dark:text-gray-400"
            >
              Reset session
            </button>
          )}
        </div>
      </header>

      <WalkAwayGate value={session.walkAwayOtd} onChange={setWalkAway} />

      <CompsInput comps={session.comps} onChange={setComps} />

      <section className="rounded-lg border border-gray-300 dark:border-gray-700 p-4">
        <DealInput disabled={!canSubmit} onSubmit={generate} />
        {!canSubmit && session.walkAwayOtd == null && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
            Set your walk-away OTD above before generating a script.
          </p>
        )}
      </section>

      {topLevelError && (
        <div className="rounded border border-red-300 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 p-3 text-sm">
          {topLevelError}
        </div>
      )}

      <RoundHistory rounds={session.rounds} />

      <footer className="text-xs text-gray-500 dark:text-gray-500 mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
        v0.1 · session stays on this device (localStorage) · no accounts, no server storage
      </footer>
    </main>
  );
}
