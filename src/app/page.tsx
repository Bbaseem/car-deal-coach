'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setReply('');
    setError('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setReply(data.reply ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Car Deal Coach</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          rows={4}
          className="w-full border rounded p-3 text-base"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-black text-white rounded px-4 py-3 text-base font-medium disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
      {error && (
        <div className="border border-red-300 bg-red-50 text-red-900 rounded p-3 text-sm">
          Error: {error}
        </div>
      )}
      {reply && (
        <div className="border rounded p-3 whitespace-pre-wrap text-base">
          {reply}
        </div>
      )}
    </main>
  );
}
