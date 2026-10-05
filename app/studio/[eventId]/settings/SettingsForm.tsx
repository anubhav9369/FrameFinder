'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EventRow } from '@/lib/studio-types';

const inputCls =
  'w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400';

export default function SettingsForm({ event }: { event: EventRow }) {
  const router = useRouter();
  const [name, setName] = useState(event.name);
  const [location, setLocation] = useState(event.location ?? '');
  const [eventDate, setEventDate] = useState(event.event_date ?? '');
  const [whatsapp, setWhatsapp] = useState(event.photographer_whatsapp ?? '');
  const [pricePerPhoto, setPricePerPhoto] = useState(
    event.price_per_photo != null ? String(event.price_per_photo) : '',
  );
  const [eventPrice, setEventPrice] = useState(
    event.event_price != null ? String(event.event_price) : '',
  );
  const [watermark, setWatermark] = useState(event.watermark_text ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim() || null,
          event_date: eventDate || null,
          photographer_whatsapp: whatsapp.trim() || null,
          price_per_photo: pricePerPhoto === '' ? null : Number(pricePerPhoto),
          event_price: eventPrice === '' ? null : Number(eventPrice),
          watermark_text: watermark.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Could not save settings.');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${event.name}" and all its photos? This cannot be undone.`,
      )
    )
      return;
    setDeleting(true);
    const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/studio');
      router.refresh();
    } else {
      setDeleting(false);
      setError('Could not delete the event.');
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      <div>
        <label className="text-sm font-medium text-zinc-300">Event name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={`${inputCls} mt-1`} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-zinc-300">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Jaipur" className={`${inputCls} mt-1`} />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300">Event date</label>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={`${inputCls} mt-1`} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-300">Photographer WhatsApp</label>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="e.g. 919876543210"
          className={`${inputCls} mt-1`}
        />
        <p className="text-xs text-zinc-500 mt-1">Country code + number, no + or spaces. Used for client finish messages and order chats.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-zinc-300">Price per photo (₹)</label>
          <input
            type="number"
            min={0}
            value={pricePerPhoto}
            onChange={(e) => setPricePerPhoto(e.target.value)}
            placeholder="Optional"
            className={`${inputCls} mt-1`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300">Full-event price (₹)</label>
          <input
            type="number"
            min={0}
            value={eventPrice}
            onChange={(e) => setEventPrice(e.target.value)}
            placeholder="Optional"
            className={`${inputCls} mt-1`}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-300">Watermark text</label>
        <input
          value={watermark}
          onChange={(e) => setWatermark(e.target.value)}
          placeholder="e.g. © YourStudio"
          className={`${inputCls} mt-1`}
        />
        <p className="text-xs text-zinc-500 mt-1">
          Previews in the exported client gallery carry this watermark; your originals stay clean.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-emerald-400">Saved ✓</p>}

      <div className="flex items-center justify-between pt-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-xl px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-40"
        >
          {deleting ? 'Deleting…' : 'Delete event'}
        </button>
      </div>
    </form>
  );
}
