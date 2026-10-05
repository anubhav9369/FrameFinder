'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { EventRow, FolderRow, PhotoRow } from '@/lib/studio-types';

const PRESETS = ['Haldi', 'Mehndi', 'Sangeet', 'Marriage'];

interface UploadItem {
  name: string;
  status: 'uploading' | 'saving' | 'done' | 'error';
  error?: string;
}

function useSignedUrls(photos: PhotoRow[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
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
  return urls;
}

export default function EventWorkspace({
  event,
  folders: initialFolders,
  photos: initialPhotos,
  userId,
}: {
  event: EventRow;
  folders: FolderRow[];
  photos: PhotoRow[];
  userId: string;
}) {
  const pathname = usePathname();
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [customFolder, setCustomFolder] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [quotaHit, setQuotaHit] = useState(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const urls = useSignedUrls(photos);

  const folderName = useCallback(
    (folderId: string | null) =>
      folders.find((f) => f.id === folderId)?.name ?? 'Unfiled',
    [folders],
  );

  const visiblePhotos =
    activeFolder === 'all'
      ? photos
      : photos.filter((p) => p.folder_id === activeFolder);

  // ---------- folders ----------

  async function addFolder(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, name: trimmed }),
    });
    if (!res.ok) return;
    const folder = (await res.json()) as FolderRow;
    setFolders((f) => [...f, folder]);
    setCustomFolder('');
  }

  async function saveRename(id: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }
    const res = await fetch(`/api/folders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      setFolders((f) => f.map((x) => (x.id === id ? { ...x, name: trimmed } : x)));
    }
    setRenamingId(null);
  }

  async function deleteFolder(id: string) {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;
    if (
      !window.confirm(
        `Delete folder "${folder.name}"? Photos inside become Unfiled. This cannot be undone.`,
      )
    )
      return;
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    setFolders((f) => f.filter((x) => x.id !== id));
    setPhotos((p) => p.map((x) => (x.folder_id === id ? { ...x, folder_id: null } : x)));
    if (activeFolder === id) setActiveFolder('all');
  }

  // ---------- upload ----------

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const folderId = activeFolder === 'all' ? null : activeFolder;
    const supabase = createClient();
    const items: UploadItem[] = Array.from(files).map((f) => ({
      name: f.name,
      status: 'uploading' as const,
    }));
    setUploads(items);
    setQuotaHit(false);

    const update = (idx: number, patch: Partial<UploadItem>) =>
      setUploads((u) => u.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

    const created: PhotoRow[] = [];
    let idx = 0;
    for (const file of Array.from(files)) {
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const path = `${userId}/${event.id}/${folderId ?? 'unfiled'}/${safeName}`;
      const { error: upErr } = await supabase.storage
        .from('event-photos')
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        update(idx, { status: 'error', error: upErr.message });
        idx++;
        continue;
      }
      update(idx, { status: 'saving' });
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          folderId,
          storage_path: path,
          filename: file.name,
          file_size: file.size,
        }),
      });
      if (res.status === 402) {
        setQuotaHit(true);
        update(idx, { status: 'error', error: 'Photo quota reached — upgrade to add more.' });
        idx++;
        continue;
      }
      if (!res.ok) {
        update(idx, { status: 'error', error: 'Could not save photo metadata.' });
        idx++;
        continue;
      }
      const photo = (await res.json()) as PhotoRow;
      created.push(photo);
      update(idx, { status: 'done' });
      idx++;
    }
    if (created.length > 0) setPhotos((p) => [...p, ...created]);
  }

  // ---------- photos ----------

  async function toggleStar(photo: PhotoRow) {
    const next = !photo.starred;
    setPhotos((p) => p.map((x) => (x.id === photo.id ? { ...x, starred: next } : x)));
    await fetch(`/api/photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: next }),
    });
  }

  // Folder moves go through PATCH { folderId } — the storage object is untouched.
  async function movePhoto(photo: PhotoRow, newFolderId: string | null) {
    if (photo.folder_id === newFolderId) return;
    const res = await fetch(`/api/photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: newFolderId }),
    });
    if (!res.ok) return;
    const { photo: updated } = (await res.json()) as { photo: PhotoRow };
    setPhotos((p) => p.map((x) => (x.id === photo.id ? updated : x)));
    setLightboxId(updated.id);
  }

  // ---------- lightbox ----------

  const lightboxPhoto = lightboxId ? photos.find((p) => p.id === lightboxId) ?? null : null;
  const lightboxList = visiblePhotos;
  const lightboxIdx = lightboxPhoto ? lightboxList.findIndex((p) => p.id === lightboxPhoto.id) : -1;

  function lbNav(d: number) {
    if (lightboxList.length === 0) return;
    const next = (lightboxIdx + d + lightboxList.length) % lightboxList.length;
    setLightboxId(lightboxList[next].id);
  }

  useEffect(() => {
    if (!lightboxId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxId(null);
      else if (e.key === 'ArrowRight') lbNav(1);
      else if (e.key === 'ArrowLeft') lbNav(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const tabs = [
    { href: `/studio/${event.id}`, label: 'Photos' },
    { href: `/studio/${event.id}/people`, label: 'People' },
    { href: `/studio/${event.id}/search`, label: 'Search' },
    { href: `/studio/${event.id}/selected`, label: 'Selected' },
    { href: `/studio/${event.id}/settings`, label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      {/* breadcrumb + tabs */}
      <div>
        <p className="text-xs text-zinc-500">
          <Link href="/studio" className="hover:text-zinc-300">Events</Link>
          {' / '}
          <span className="text-zinc-300">{event.name}</span>
        </p>
        <h1 className="text-2xl font-bold mt-1">{event.name}</h1>
        <div className="flex gap-1 mt-4 border-b border-zinc-800">
          {tabs.map((t) => {
            const active =
              t.href === `/studio/${event.id}`
                ? pathname === t.href
                : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-amber-400 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* folder bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveFolder('all')}
          className={`rounded-full px-4 py-1.5 text-sm ${
            activeFolder === 'all'
              ? 'bg-amber-400 text-zinc-950 font-bold'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          All photos
        </button>
        {folders.map((f) =>
          renamingId === f.id ? (
            <span key={f.id} className="flex items-center gap-1">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename(f.id);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                className="rounded-full bg-zinc-950 border border-amber-400 px-3 py-1.5 text-sm w-32 focus:outline-none"
              />
              <button onClick={() => saveRename(f.id)} className="text-xs text-amber-300">Save</button>
            </span>
          ) : (
            <span
              key={f.id}
              className={`flex items-center rounded-full pl-4 pr-1 py-1 text-sm ${
                activeFolder === f.id
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <button onClick={() => setActiveFolder(f.id)} className="pr-1">
                {f.name}
              </button>
              <button
                title="Rename folder"
                onClick={() => {
                  setRenamingId(f.id);
                  setRenameValue(f.name);
                }}
                className="px-1.5 opacity-60 hover:opacity-100"
              >
                ✎
              </button>
              <button
                title="Delete folder"
                onClick={() => deleteFolder(f.id)}
                className="px-1.5 opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </span>
          ),
        )}
        <div className="flex items-center gap-1 ml-2">
          {PRESETS.filter((p) => !folders.some((f) => f.name === p)).map((p) => (
            <button
              key={p}
              onClick={() => addFolder(p)}
              className="rounded-full border border-dashed border-zinc-600 px-3 py-1.5 text-xs text-zinc-400 hover:border-amber-400 hover:text-amber-300"
            >
              + {p}
            </button>
          ))}
          <input
            value={customFolder}
            onChange={(e) => setCustomFolder(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addFolder(customFolder);
            }}
            placeholder="New folder…"
            className="rounded-full bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs w-28 focus:outline-none focus:border-amber-400 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {quotaHit && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <span className="text-amber-300 font-semibold">Photo quota reached.</span>{' '}
          <Link href="/pricing" className="text-amber-300 underline">Upgrade your plan</Link> to upload more photos.
        </div>
      )}

      {/* upload zone */}
      <div className="rounded-2xl border border-dashed border-zinc-700 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-medium">
              Upload to {activeFolder === 'all' ? 'Unfiled' : folderName(activeFolder)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">JPEG, PNG or WebP. Uploaded to private storage.</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-amber-300"
          >
            Choose photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
        {uploads.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm max-h-40 overflow-y-auto">
            {uploads.map((u, i) => (
              <li key={i} className="flex justify-between gap-2 text-zinc-400">
                <span className="truncate">{u.name}</span>
                <span
                  className={
                    u.status === 'done'
                      ? 'text-emerald-400'
                      : u.status === 'error'
                        ? 'text-red-400'
                        : 'text-amber-300'
                  }
                >
                  {u.status === 'uploading' && 'Uploading…'}
                  {u.status === 'saving' && 'Saving…'}
                  {u.status === 'done' && '✓ Done'}
                  {u.status === 'error' && `✕ ${u.error ?? 'Failed'}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* photo grid */}
      <div>
        <p className="text-sm text-zinc-500 mb-3">
          {visiblePhotos.length} photo{visiblePhotos.length === 1 ? '' : 's'}
          {activeFolder !== 'all' && ` in ${folderName(activeFolder)}`}
        </p>
        {visiblePhotos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-sm text-zinc-500">
            No photos here yet. Choose photos above to upload.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {visiblePhotos.map((p) => (
              <div
                key={p.id}
                className={`group relative aspect-square overflow-hidden rounded-xl bg-zinc-900 cursor-pointer ${
                  p.starred ? 'ring-2 ring-amber-400' : ''
                }`}
                onClick={() => setLightboxId(p.id)}
              >
                {urls[p.id] ? (
                  <img src={urls[p.id]} alt={p.filename} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full animate-pulse bg-zinc-800" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(p);
                  }}
                  title={p.starred ? 'Unstar' : 'Star'}
                  className={`absolute top-2 right-2 h-8 w-8 rounded-full text-lg flex items-center justify-center ${
                    p.starred ? 'bg-amber-400 text-zinc-950' : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {p.starred ? '★' : '☆'}
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-1.5 flex items-center gap-1.5">
                  {activeFolder === 'all' && (
                    <span className="rounded bg-zinc-700/90 px-1.5 py-0.5 text-[10px] text-zinc-200 truncate max-w-[45%]">
                      {folderName(p.folder_id)}
                    </span>
                  )}
                  <span className="truncate text-[10px] text-zinc-300">{p.filename}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setLightboxId(null)}
        >
          <div className="flex-1 flex items-center justify-center min-h-0 p-4" onClick={(e) => e.stopPropagation()}>
            {urls[lightboxPhoto.id] ? (
              <img
                src={urls[lightboxPhoto.id]}
                alt={lightboxPhoto.filename}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-zinc-400">Loading…</div>
            )}
          </div>
          <div
            className="flex items-center justify-between gap-3 bg-zinc-900 px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => lbNav(-1)} className="rounded-lg bg-zinc-800 px-3 py-2 text-lg hover:bg-zinc-700">‹</button>
            <div className="min-w-0 text-center">
              <p className="truncate text-sm text-zinc-200">
                {folderName(lightboxPhoto.folder_id)} · {lightboxPhoto.filename}
              </p>
              <p className="text-xs text-zinc-500">
                {lightboxIdx + 1} / {lightboxList.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={lightboxPhoto.folder_id ?? ''}
                onChange={(e) => movePhoto(lightboxPhoto, e.target.value || null)}
                className="rounded-lg bg-zinc-800 px-2 py-2 text-xs text-zinc-200 focus:outline-none"
                title="Move to folder"
              >
                <option value="">Unfiled</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => toggleStar(lightboxPhoto)}
                className={`rounded-lg px-3 py-2 text-lg ${
                  lightboxPhoto.starred ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                {lightboxPhoto.starred ? '★' : '☆'}
              </button>
              <button onClick={() => lbNav(1)} className="rounded-lg bg-zinc-800 px-3 py-2 text-lg hover:bg-zinc-700">›</button>
              <button onClick={() => setLightboxId(null)} className="rounded-lg bg-zinc-800 px-3 py-2 hover:bg-zinc-700">✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
