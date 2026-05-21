'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    try {
      void fetch('/api/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          url: typeof window !== 'undefined' ? window.location.href : '',
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-6 flex flex-col gap-3">
        <h1 className="text-lg font-semibold text-red-900 dark:text-red-200">Something broke.</h1>
        <p className="text-sm text-red-900/80 dark:text-red-200/80">
          The error was logged. You can try again — your session is saved on this device.
        </p>
        {error.digest && (
          <p className="text-xs text-red-900/60 dark:text-red-200/60 font-mono">
            ref: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="self-start px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
