'use client';

import type { Round } from '@/lib/types';
import { OutputCard } from './OutputCard';

type Props = {
  rounds: Round[];
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function RoundHistory({ rounds }: Props) {
  if (rounds.length === 0) return null;
  return (
    <div className="flex flex-col gap-8">
      {rounds.map((r, i) => (
        <div key={r.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 font-bold">
              Round {i + 1}
            </span>
            <span>{formatTime(r.createdAt)}</span>
          </div>
          <section className="rounded-lg border border-gray-300 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
            <div className="text-xs uppercase tracking-wide font-medium text-gray-600 dark:text-gray-400 mb-1">
              You pasted
            </div>
            <pre className="text-sm whitespace-pre-wrap font-sans">{r.userMessage}</pre>
          </section>
          {r.output && <OutputCard output={r.output} />}
          {r.error && (
            <div className="rounded border border-red-300 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 p-3 text-sm">
              Error: {r.error}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
