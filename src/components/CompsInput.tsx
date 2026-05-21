'use client';

import type { Comp } from '@/lib/types';

type Props = {
  comps: Comp[];
  onChange: (comps: Comp[]) => void;
};

function makeId() {
  return `comp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function CompsInput({ comps, onChange }: Props) {
  function updateText(id: string, text: string) {
    onChange(comps.map((c) => (c.id === id ? { ...c, text } : c)));
  }
  function remove(id: string) {
    onChange(comps.filter((c) => c.id !== id));
  }
  function add() {
    if (comps.length >= 5) return;
    onChange([...comps, { id: makeId(), text: '' }]);
  }

  return (
    <section className="rounded-lg border border-gray-300 dark:border-gray-700 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">Comparable listings ({comps.length}/5)</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Paste 3–5 listings from Cars.com, AutoTrader, or CarGurus. Include price, miles, trim, location if you can.
          </div>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={comps.length >= 5}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-40"
        >
          + Add comp
        </button>
      </div>
      {comps.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 dark:border-gray-700 p-3 text-sm text-gray-600 dark:text-gray-400">
          No comps yet. The app will run in <strong>low-confidence mode</strong> and coach you to stall and paste comps before generating a final script.
        </div>
      ) : (
        comps.map((c, i) => (
          <div key={c.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 font-medium">
                Comp #{i + 1}
              </label>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="text-xs text-red-700 dark:text-red-400 underline"
              >
                Remove
              </button>
            </div>
            <textarea
              value={c.text}
              onChange={(e) => updateText(c.id, e.target.value)}
              placeholder={'e.g. "2022 Honda Odyssey EX-L, 28k mi, $34,500, dealer in Pleasanton CA"'}
              rows={2}
              className="w-full border rounded p-2 text-sm bg-white dark:bg-black/30 border-gray-300 dark:border-gray-700"
            />
          </div>
        ))
      )}
    </section>
  );
}
