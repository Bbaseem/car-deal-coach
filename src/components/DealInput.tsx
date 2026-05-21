'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  disabled: boolean;
  onSubmit: (message: string) => void;
};

const PLACEHOLDER = `Paste or describe the dealer's latest offer. Example:
"2023 Honda Odyssey EX-L. Sticker $44,200. Their offer: $43,500 + $899 doc fee + $1,800 paint protection + $695 nitrogen tires + tax/title/license. APR 7.4% / 72 months. Trade allowance $12,000."`;

export function DealInput({ disabled, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 480) + 'px';
  }, [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
  }

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit();
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handle} className="flex flex-col gap-2">
      <label htmlFor="deal-input" className="text-sm font-medium">
        Dealer offer / your message
      </label>
      <textarea
        id="deal-input"
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder={PLACEHOLDER}
        rows={6}
        disabled={disabled}
        className="w-full border rounded p-3 text-base bg-white dark:bg-black/30 border-gray-300 dark:border-gray-700 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 resize-none min-h-[160px]"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">
          Press{' '}
          <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-xs">
            ⌘ Enter
          </kbd>{' '}
          to submit
        </p>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-5 py-2.5 rounded bg-black hover:bg-gray-800 text-white text-sm font-medium disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {disabled ? 'Thinking…' : 'Generate counter-offer script'}
        </button>
      </div>
    </form>
  );
}
