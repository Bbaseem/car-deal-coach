'use client';

import { useCallback, useEffect, useState } from 'react';

type Props = {
  text: string;
  label?: string;
  className?: string;
};

export function CopyButton({ text, label = 'Copy', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const handle = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={copied ? 'Copied to clipboard' : `Copy ${label.toLowerCase()}`}
      className={
        'inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-black/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[28px] min-w-[64px] justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ' +
        className
      }
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
