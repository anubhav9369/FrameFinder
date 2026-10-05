'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewEventForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    setQuotaExceeded(false);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.status === 402) {
        setQuotaExceeded(true);
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error('Could not create the event.');
      const event = await res.json();
      router.push(`/studio/${event.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSaving(false);
    }
  }

  if (quotaExceeded) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 max-w-xl">
        <h3 className="text-lg font-semibold text-amber-300">You&apos;ve used your free event</h3>
        <p className="mt-2 text-sm text-zinc-300">
          The free plan includes one trial event. Upgrade to create unlimited events and keep the bookings coming.
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-block rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300"
        >
          View plans
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 transition-colors"
      >
        + New event
      </button>
    );
  }

  return (
    <form onSubmit={handleCreate} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 max-w-xl">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Event name — e.g. Sharma Wedding, Jaipur"
        className="flex-1 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
      />
      <button
        type="submit"
        disabled={!name.trim() || saving}
        className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-950 disabled:opacity-40 hover:bg-amber-300"
      >
        {saving ? 'Creating…' : 'Create'}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
        className="text-sm text-zinc-400 hover:text-zinc-200"
      >
        Cancel
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
