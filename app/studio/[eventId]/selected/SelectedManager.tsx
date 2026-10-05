'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import JSZip from 'jszip';
import { createClient } from '@/lib/supabase/client';
import type { EventRow, FolderRow, PhotoRow } from '@/lib/studio-types';

interface ImportReport {
  matched: number;
  total: number;
  unmatched: string[];
}

export default function SelectedManager({
  event,
  folders,
  initialPhotos,
}: {
  event: EventRow;
  folders: FolderRow[];
  initialPhotos: PhotoRow[];
}) {
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folderName = (folderId: string | null) =>
    folders.find((f) => f.id === folderId)?.name ?? 'Unfiled';

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const supabase = createClient();
      const entries: Record<string, string> = {};
      for (const p of photos) {
        const { data, error } = await supabase.storage
          .from('event-photos')
          .createSignedUrl(p.storage_path, 3600);
        if (!error && data?.signedUrl) entries[p.id] = data.signedUrl;
        if (cancelled) return;
      }
      if (!cancelled) setUrls(entries);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [photos]);

  async function refreshStarred() {
    const supabase = createClient();
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', event.id)
      .eq('starred', true)
      .order('created_at', { ascending: true });
    setPhotos((data ?? []) as PhotoRow[]);
  }

  async function runImport(text: string) {
    if (!text.trim() || importing) return;
    setImporting(true);
    setImportError(null);
    setReport(null);
    try {
      const res = await fetch('/api/selections/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, text }),
      });
      if (!res.ok) throw new Error('Import failed. Check the pasted message and try again.');
      const body = (await res.json()) as {
        matched: { id: string; filename: string; folder: string }[];
        unmatched: string[];
      };
      const total = body.matched.length + body.unmatched.length;
      setReport({ matched: body.matched.length, total, unmatched: body.unmatched });
      setImportText('');
      await refreshStarred();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  function importFromFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => runImport(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  async function unstar(photo: PhotoRow) {
    setPhotos((p) => p.filter((x) => x.id !== photo.id));
    await fetch(`/api/photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: false }),
    });
  }

  async function clearAll() {
    if (!window.confirm(`Remove all ${photos.length} photos from Selected?`)) return;
    const ids = photos.map((p) => p.id);
    setPhotos([]);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/photos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ starred: false }),
        }),
      ),
    );
  }

  function download(href: string, name: string) {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    }, 800);
  }

  async function signedUrlFor(p: PhotoRow): Promise<string | null> {
    if (urls[p.id]) return urls[p.id];
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('event-photos')
      .createSignedUrl(p.storage_path, 3600);
    return error || !data?.signedUrl ? null : data.signedUrl;
  }

  async function downloadZip() {
    if (photos.length === 0 || exporting) return;
    setExporting('zip');
    try {
      const zip = new JSZip();
      const supabase = createClient();
      for (const p of photos) {
        const { data, error } = await supabase.storage
          .from('event-photos')
          .createSignedUrl(p.storage_path, 3600);
        if (error || !data?.signedUrl) continue;
        const res = await fetch(data.signedUrl);
        const blob = await res.blob();
        const folder = zip.folder(folderName(p.folder_id)) ?? zip;
        folder.file(p.filename, blob);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      download(URL.createObjectURL(blob), `${slug(event.name)}-selected.zip`);
    } finally {
      setExporting(null);
    }
  }

  async function downloadContactSheet() {
    if (photos.length === 0 || exporting) return;
    setExporting('sheet');
    try {
      const cols = 4;
      const cell = 320;
      const rows = Math.ceil(photos.length / cols);
      const canvas = document.createElement('canvas');
      canvas.width = cols * cell;
      canvas.height = rows * (cell + 28);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      let i = 0;
      for (const p of photos) {
        const url = await signedUrlFor(p);
        if (!url) {
          i++;
          continue;
        }
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => resolve(im);
          im.onerror = reject;
          im.src = url;
        });
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cell;
        const y = row * (cell + 28);
        // cover-fit
        const scale = Math.max(cell / img.width, cell / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, x - (dw - cell) / 2, y - (dh - cell) / 2, dw, dh);
        ctx.fillStyle = '#e4e4e7';
        ctx.font = '14px sans-serif';
        ctx.fillText(`${folderName(p.folder_id)} · ${p.filename}`.slice(0, 42), x + 8, y + cell + 18);
        i++;
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (blob) download(URL.createObjectURL(blob), `${slug(event.name)}-contact-sheet.png`);
    } finally {
      setExporting(null);
    }
  }

  function whatsappNumber(): string {
    return (event.photographer_whatsapp ?? '').replace(/[^0-9]/g, '');
  }

  function selectionLines(): string[] {
    return photos.map((p) => `${folderName(p.folder_id)} | ${p.filename}`);
  }

  function openWhatsappList() {
    const wa = whatsappNumber();
    const text = `Selected photos for ${event.name} (${photos.length}):\n\n${selectionLines().join('\n')}`;
    if (wa) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank');
    else alert('Add your WhatsApp number in Settings to message directly.');
  }

  function orderViaWhatsapp() {
    const wa = whatsappNumber();
    const price = event.price_per_photo;
    const lines = photos.map((p) => {
      const label = price != null ? ` — ₹${price}` : '';
      return `- ${folderName(p.folder_id)} | ${p.filename}${label}`;
    });
    const total = price != null ? `\n\nTotal: ₹${price * photos.length} (${photos.length} photos)` : '';
    const text = `Hello! I'd like to order prints from ${event.name}:\n\n${lines.join('\n')}${total}`;
    if (wa) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank');
    else alert('Add your WhatsApp number in Settings to send the order directly.');
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500">
          <Link href={`/studio/${event.id}`} className="hover:text-zinc-300">{event.name}</Link>
          {' / Selected'}
        </p>
        <h1 className="text-2xl font-bold mt-1">Selected</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Every photo the client starred, in one place. Export originals, send a contact sheet, or
          take WhatsApp orders — ordering is WhatsApp-based; the subscription paywall is handled
          separately via Razorpay.
        </p>
      </div>

      {/* HERO paste-import */}
      <div className="rounded-2xl border border-amber-400/40 bg-amber-400/5 p-6">
        <h2 className="text-lg font-bold text-amber-300">Paste customer&apos;s WhatsApp message</h2>
        <p className="text-sm text-zinc-400 mt-1 mb-4">
          Copy the customer&apos;s finish message from WhatsApp and paste it here — every pick is
          starred automatically.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={5}
          placeholder="Paste the FRAMEFINDER_SELECTION_V1 message here…"
          className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
        />
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <button
            onClick={() => runImport(importText)}
            disabled={!importText.trim() || importing}
            className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
          >
            {importing ? 'Importing…' : 'Import picks'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:border-amber-400"
          >
            Import from file instead
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json,text/plain"
            className="hidden"
            onChange={(e) => {
              importFromFile(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
        {report && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
            <p className="text-emerald-300 font-semibold">
              {report.matched} of {report.total} photos matched and added to Selected.
            </p>
            {report.unmatched.length > 0 && (
              <div className="mt-2 text-zinc-300">
                <p className="font-medium">Couldn&apos;t match:</p>
                <ul className="list-disc ml-5 mt-1 text-zinc-400">
                  {report.unmatched.map((u, i) => (
                    <li key={i} className="truncate">{u}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {importError && <p className="mt-3 text-sm text-red-400">{importError}</p>}
      </div>

      {/* exports */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={downloadZip}
          disabled={photos.length === 0 || exporting !== null}
          className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-white disabled:opacity-40"
        >
          {exporting === 'zip' ? 'Building ZIP…' : 'Download originals (.zip)'}
        </button>
        <button
          onClick={downloadContactSheet}
          disabled={photos.length === 0 || exporting !== null}
          className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-amber-400 disabled:opacity-40"
        >
          {exporting === 'sheet' ? 'Building sheet…' : 'Download contact sheet'}
        </button>
        <button
          onClick={openWhatsappList}
          disabled={photos.length === 0}
          className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-amber-400 disabled:opacity-40"
        >
          WhatsApp photographer
        </button>
        <button
          onClick={orderViaWhatsapp}
          disabled={photos.length === 0}
          className="rounded-xl border border-emerald-600/60 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
        >
          Order via WhatsApp{event.price_per_photo != null ? ` (₹${event.price_per_photo}/photo)` : ''}
        </button>
        {photos.length > 0 && (
          <button onClick={clearAll} className="rounded-xl px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
            Clear all
          </button>
        )}
      </div>

      {/* grid */}
      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 p-12 text-center">
          <p className="text-lg font-medium text-zinc-300">No selected photos yet</p>
          <p className="text-sm text-zinc-500 mt-2">
            Star photos in the Photos tab, or paste the customer&apos;s WhatsApp finish message above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900 ring-2 ring-amber-400">
              {urls[p.id] ? (
                <img src={urls[p.id]} alt={p.filename} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full animate-pulse bg-zinc-800" />
              )}
              <button
                onClick={() => unstar(p)}
                title="Remove from Selected"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-amber-400 text-zinc-950 text-lg flex items-center justify-center"
              >
                ★
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-1.5">
                <span className="rounded bg-zinc-700/90 px-1.5 py-0.5 text-[10px] text-zinc-200">{folderName(p.folder_id)}</span>
                <p className="truncate text-[10px] text-zinc-300 mt-0.5">{p.filename}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
}
