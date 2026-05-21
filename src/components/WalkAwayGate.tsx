'use client';

import { useState } from 'react';

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  editNote?: boolean;
};

export function WalkAwayGate({ value, onChange, editNote = false }: Props) {
  const [draft, setDraft] = useState<string>(value != null ? String(value) : '');
  const [editing, setEditing] = useState<boolean>(value == null);

  function commit() {
    const cleaned = draft.replace(/[^\d.]/g, '');
    if (!cleaned) {
      onChange(null);
      setEditing(true);
      return;
    }
    const num = Number(cleaned);
    if (Number.isFinite(num) && num > 0) {
      onChange(num);
      setEditing(false);
    }
  }

  if (!editing && value != null) {
    return (
      <section className="rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-300 font-medium">
              Your walk-away OTD
            </div>
            <div className="text-2xl font-semibold tabular-nums">${value.toLocaleString()}</div>
            <div className="text-xs text-emerald-900/70 dark:text-emerald-200/70 mt-1">
              The script will anchor this as your own number.
              {editNote && ' Changes apply to your next round, not past rounds.'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm underline text-emerald-900 dark:text-emerald-200 min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Edit
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-4 flex flex-col gap-2">
      <label htmlFor="walk-away-input" className="text-sm font-medium">
        Walk-away OTD ceiling
        <span className="block text-xs font-normal text-amber-900/70 dark:text-amber-200/70 mt-0.5">
          The total out-the-door price above which you walk away. Set this before generating a
          script.
        </span>
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-base text-gray-500">
            $
          </span>
          <input
            id="walk-away-input"
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
            }}
            placeholder="42000"
            className="w-full pl-7 pr-3 py-2 border rounded bg-white dark:bg-black/30 border-gray-300 dark:border-gray-700 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={commit}
          className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          Save
        </button>
      </div>
    </section>
  );
}
