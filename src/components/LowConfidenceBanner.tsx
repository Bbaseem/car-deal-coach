'use client';

import type { NoCompsCoaching } from '@/lib/types';

type Props = {
  reason?: string;
  coaching?: NoCompsCoaching;
};

export function LowConfidenceBanner({ reason, coaching }: Props) {
  return (
    <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/40 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="inline-block px-2 py-0.5 rounded bg-red-600 text-white text-xs font-bold uppercase tracking-wide">
          Low confidence
        </span>
        <span className="text-sm font-medium text-red-900 dark:text-red-200">
          No comps pasted — this output is LLM-only.
        </span>
      </div>
      {reason && <p className="text-sm text-red-900 dark:text-red-200">{reason}</p>}
      {coaching && (
        <div className="flex flex-col gap-2 mt-1">
          <div>
            <div className="text-xs uppercase tracking-wide font-medium text-red-900 dark:text-red-200">
              Stall script (read this, then go paste comps)
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap">{coaching.stallScript}</p>
          </div>
          {coaching.searchUrls.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide font-medium text-red-900 dark:text-red-200">
                Open these to find comps fast
              </div>
              <ul className="mt-1 flex flex-wrap gap-2">
                {coaching.searchUrls.map((u, i) => (
                  <li key={i}>
                    <a
                      href={u.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-3 py-1.5 rounded border border-red-400 text-sm text-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      {u.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
