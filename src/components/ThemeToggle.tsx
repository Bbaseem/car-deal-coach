'use client';

import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

const OPTIONS: { value: Theme; label: string; title: string }[] = [
  { value: 'light', label: 'Light', title: 'Light theme' },
  { value: 'dark', label: 'Dark', title: 'Dark theme' },
  { value: 'system', label: 'Auto', title: 'Follow system preference' },
];

export function ThemeToggle() {
  const { theme, setTheme, hydrated } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden text-xs"
    >
      {OPTIONS.map((opt) => {
        const active = hydrated && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => setTheme(opt.value)}
            className={
              'px-2.5 py-1 border-r last:border-r-0 border-gray-300 dark:border-gray-700 transition-colors ' +
              (active
                ? 'bg-gray-900 text-white dark:bg-white dark:text-black font-medium'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
