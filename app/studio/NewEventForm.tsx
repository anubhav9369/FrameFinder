'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { EventRow } from '@/lib/studio-types';

const inputCls =
  'w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400';

const labelCls = 'text-sm font-medium text-zinc-300';

export default function NewEventForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [pricePerPhoto, setPricePerPhoto] = useState('');
  const [eventPrice, setEventPrice] = useState('');
  const [watermark, setWatermark] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(35);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    setQuotaExceeded(false);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          location: location.trim() || null,
          event_date: eventDate || null,
          photographer_whatsapp: whatsapp.trim() || null,
          price_per_photo: pricePerPhoto === '' ? null : Number(pricePerPhoto),
          event_price: eventPrice === '' ? null : Number(eventPrice),
          watermark_text: watermark.trim() || null,
        }),
      });
      if (res.status === 402) {
        setQuotaExceeded(true);
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error('Could not create the event.');
      const { event } = (await res.json()) as { event: EventRow };
      // Watermark opacity has no DB column — it is a per-device preview setting.
      try {
        localStorage.setItem(`ff-watermark-opacity:${event.id}`, String(watermarkOpacity));
      } catch {
        /* storage unavailable */
      }
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
          The free plan includes one trial event. Upgrade to create unlimited events and keep the
          bookings coming.
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
    <form
      onSubmit={handleCreate}
      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 max-w-2xl w-full space-y-4"
    >
      <div>
        <h3 className="text-lg font-bold">Create an event gallery</h3>
        <p className="text-sm text-zinc-500 mt-1">
          One event = one shoot. Pricing and watermark settings can be changed later in Settings.
        </p>
      </div>

      <div>
        <label className={labelCls}>Event name *</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sharma Wedding, Jaipur"
          className={`${inputCls} mt-1`}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Jaipur"
            className={`${inputCls} mt-1`}
          />
        </div>
        <div>
          <label className={labelCls}>Event date</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Photographer WhatsApp</label>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="e.g. 919876543210"
          className={`${inputCls} mt-1`}
        />
        <p className="text-xs text-zinc-500 mt-1">
          Used for client selection imports and WhatsApp ordering, with country code.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Price per photo (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={pricePerPhoto}
            onChange={(e) => setPricePerPhoto(e.target.value)}
            placeholder="e.g. 150"
            className={`${inputCls} mt-1`}
          />
        </div>
        <div>
          <label className={labelCls}>Whole-event price (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={eventPrice}
            onChange={(e) => setEventPrice(e.target.value)}
            placeholder="e.g. 25000"
            className={`${inputCls} mt-1`}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Watermark text</label>
        <input
          value={watermark}
          onChange={(e) => setWatermark(e.target.value)}
          placeholder="e.g. © Sharma Photography"
          className={`${inputCls} mt-1`}
        />
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400">Watermark opacity</label>
            <span className="text-xs text-zinc-400">{watermarkOpacity}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            value={watermarkOpacity}
            onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
            className="w-full accent-amber-400 mt-1"
          />
          {watermark.trim() && (
            <div className="relative mt-2 h-20 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center">
              <span className="text-xs text-zinc-600">Preview</span>
              <span
                className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white pointer-events-none"
                style={{ opacity: watermarkOpacity / 100 }}
              >
                {watermark.trim()}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
        >
          {saving ? 'Creating…' : 'Create gallery'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
