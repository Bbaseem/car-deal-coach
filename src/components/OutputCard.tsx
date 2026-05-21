'use client';

import type { CoachOutput } from '@/lib/types';
import { LowConfidenceBanner } from './LowConfidenceBanner';

type Props = {
  output: CoachOutput;
};

export function OutputCard({ output }: Props) {
  return (
    <article className="flex flex-col gap-4">
      {output.lowConfidence && (
        <LowConfidenceBanner
          reason={output.lowConfidenceReason}
          coaching={output.noCompsCoaching}
        />
      )}

      <section className="rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-4">
        <div className="text-xs uppercase tracking-wide font-bold text-blue-700 dark:text-blue-300 mb-1">
          Verdict
        </div>
        <div className="text-lg font-semibold text-blue-950 dark:text-blue-100">
          {output.verdict.headline}
        </div>
        <p className="text-sm text-blue-900/80 dark:text-blue-200/80 mt-1">
          {output.verdict.summary}
        </p>
      </section>

      <section className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
          <div className="text-xs uppercase tracking-wide font-bold">
            Counter-offer script &mdash; read out loud
          </div>
        </div>
        <ol className="flex flex-col">
          {output.scriptLines.map((s, i) => (
            <li
              key={i}
              className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-b-0 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-2 md:gap-4"
            >
              <div className="flex gap-2">
                <span className="font-bold text-gray-500 dark:text-gray-400 tabular-nums">
                  {i + 1}.
                </span>
                <span className="text-base leading-relaxed">&ldquo;{s.line}&rdquo;</span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-400 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-4">
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500 font-medium block">
                  Why
                </span>
                {s.reasoning}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {output.walkAwayAnchor && (
        <section className="rounded-lg border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3">
          <div className="text-xs uppercase tracking-wide font-bold text-emerald-800 dark:text-emerald-300 mb-1">
            Your walk-away line
          </div>
          <p className="text-sm italic">&ldquo;{output.walkAwayAnchor}&rdquo;</p>
        </section>
      )}

      {output.manipulationCallouts.length > 0 && (
        <section className="rounded-lg border border-orange-400 bg-orange-50 dark:bg-orange-950/30 p-4">
          <div className="text-xs uppercase tracking-wide font-bold text-orange-800 dark:text-orange-300 mb-2">
            Watch for these dealer patterns
          </div>
          <ul className="flex flex-col gap-2">
            {output.manipulationCallouts.map((m, i) => (
              <li key={i} className="text-sm">
                <strong className="text-orange-900 dark:text-orange-200">{m.pattern}: </strong>
                <span className="text-orange-900/90 dark:text-orange-200/90">{m.explanation}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
