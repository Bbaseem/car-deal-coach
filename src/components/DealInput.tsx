'use client';

import { useState } from 'react';

type Props = {
  disabled: boolean;
  onSubmit: (message: string) => void;
};

const PLACEHOLDER = `Paste or describe the dealer's latest offer. Example:
"2023 Honda Odyssey EX-L. Sticker $44,200. Their offer: $43,500 + $899 doc fee + $1,800 paint protection + $695 nitrogen tires + tax/title/license. APR 7.4% / 72 months. Trade allowance $12,000."`;

export function DealInput({ disabled, onSubmit }: Props) {
  const [value, setValue] = useState('');

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <form onSubmit={handle} className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        Dealer offer / your message
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={6}
        disabled={disabled}
        className="w-full border rounded p-3 text-sm bg-white dark:bg-black/30 border-gray-300 dark:border-gray-700 disabled:opacity-60"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-4 py-2 rounded bg-black hover:bg-gray-800 text-white text-sm font-medium disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          {disabled ? 'Thinking…' : 'Generate counter-offer script'}
        </button>
      </div>
    </form>
  );
}
