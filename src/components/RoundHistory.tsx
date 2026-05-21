'use client';

import type { Round } from '@/lib/types';
import { CopyButton } from './CopyButton';
import { OutputCard } from './OutputCard';

type Props = {
  rounds: Round[];
  pendingRoundId?: string | null;
  onRegenerate?: (round: Round) => void;
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fullScriptText(round: Round): string {
  if (!round.output) return '';
  const lines = round.output.scriptLines.map((s, i) => `${i + 1}. ${s.line}`);
  return [round.output.verdict.headline, '', ...lines].join('\n');
}

export function RoundHistory({ rounds, pendingRoundId, onRegenerate }: Props) {
  if (rounds.length === 0) return null;
  return (
    <div className="flex flex-col gap-8" aria-live="polite">
      {rounds.map((r, i) => {
        const isPending = pendingRoundId === r.id;
        return (
          <div key={r.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 font-bold">
                  Round {i + 1}
                </span>
                <span>{formatTime(r.createdAt)}</span>
                {isPending && (
                  <span className="text-blue-700 dark:text-blue-300 normal-case font-medium">
                    Thinking…
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {r.output && (
                  <CopyButton text={fullScriptText(r)} label="Copy script" />
                )}
                {onRegenerate && !isPending && (r.output || r.error) && (
                  <button
                    type="button"
                    onClick={() => onRegenerate(r)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-black/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[28px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    aria-label={r.error ? 'Retry this round' : 'Regenerate this round'}
                  >
                    {r.error ? 'Retry' : 'Regenerate'}
                  </button>
                )}
              </div>
            </div>
            <section className="rounded-lg border border-gray-300 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
              <div className="text-xs uppercase tracking-wide font-medium text-gray-600 dark:text-gray-400 mb-1">
                You pasted
              </div>
              <pre className="text-sm whitespace-pre-wrap font-sans">{r.userMessage}</pre>
            </section>
            {r.output && <OutputCard output={r.output} />}
            {r.error && (
              <div
                role="alert"
                className="rounded border border-red-300 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 p-3 text-sm"
              >
                Error: {r.error}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
