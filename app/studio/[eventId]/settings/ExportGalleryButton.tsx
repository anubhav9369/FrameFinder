'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildClientGalleryHtml } from '@/lib/gallery-export';
import type { EventRow, FolderRow, PhotoRow } from '@/lib/studio-types';

const MAX_SIDE = 1280;

async function toPreviewDataUrl(url: string, watermark: string | null): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('Could not load image'));
    im.src = url;
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(img, 0, 0, w, h);
  if (watermark) {
    const fontSize = Math.max(14, Math.round(w / 40));
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.textBaseline = 'bottom';
    const pad = Math.round(fontSize * 0.8);
    const tw = ctx.measureText(watermark).width;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(w - tw - pad * 2, h - fontSize - pad * 2, tw + pad * 2, fontSize + pad * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(watermark, w - tw - pad, h - pad);
  }
  return canvas.toDataURL('image/jpeg', 0.7);
}

export default function ExportGalleryButton({
  event,
  folders,
  photos,
}: {
  event: EventRow;
  folders: FolderRow[];
  photos: PhotoRow[];
}) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const folderNames: Record<string, string> = {};
  for (const f of folders) folderNames[f.id] = f.name;

  async function handleExport() {
    if (exporting || photos.length === 0) return;
    setExporting(true);
    setError(null);
    try {
      const supabase = createClient();
      const galleryPhotos: { folderId: string; folderName: string; filename: string; dataUrl: string }[] = [];
      let n = 0;
      for (const p of photos) {
        n++;
        setProgress(`Preparing photo ${n} of ${photos.length}…`);
        const { data, error: urlErr } = await supabase.storage
          .from('event-photos')
          .createSignedUrl(p.storage_path, 3600);
        if (urlErr || !data?.signedUrl) continue;
        try {
          const dataUrl = await toPreviewDataUrl(data.signedUrl, event.watermark_text);
          galleryPhotos.push({
            folderId: p.folder_id ?? '',
            folderName: p.folder_id ? (folderNames[p.folder_id] ?? 'Unfiled') : 'Unfiled',
            filename: p.filename,
            dataUrl,
          });
        } catch {
          // skip photos that fail to render
        }
      }
      setProgress('Building gallery file…');
      const html = buildClientGalleryHtml({
        eventName: event.name,
        photographerWhatsapp: event.photographer_whatsapp ?? '',
        folders: folders.map((f) => ({ id: f.id, name: f.name })),
        photos: galleryPhotos,
      });
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'}-client-gallery.html`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 800);
      setProgress('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold">Export client gallery</h2>
      <p className="text-sm text-zinc-400 mt-1">
        Generates one self-contained HTML file with watermarked previews, folder tabs and
        star-to-pick selection. Send the file to your client — no login needed on their side.
      </p>
      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      {progress && <p className="text-sm text-amber-300 mt-3">{progress}</p>}
      <button
        onClick={handleExport}
        disabled={exporting || photos.length === 0}
        className="mt-4 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
      >
        {exporting ? 'Exporting…' : `Export gallery (${photos.length} photos)`}
      </button>
      {photos.length === 0 && (
        <p className="text-xs text-zinc-500 mt-2">Upload photos first.</p>
      )}
    </div>
  );
}
