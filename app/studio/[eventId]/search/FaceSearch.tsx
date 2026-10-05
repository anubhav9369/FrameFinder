'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  loadModels,
  detectFaces,
  euclidean,
  groupFaces,
  loadImage,
  type DetectedFace,
} from '@/lib/face';
import { scanEventPhotos } from '@/lib/face-scan';
import type { ScanPhoto } from '../people/page';

interface Match {
  face: DetectedFace;
  distance: number;
  photo: ScanPhoto;
}

export default function FaceSearch({
  eventId,
  eventName,
  photos,
}: {
  eventId: string;
  eventName: string;
  photos: ScanPhoto[];
}) {
  const [threshold, setThreshold] = useState(0.48);
  const [stage, setStage] = useState<string>('idle');
  const [progress, setProgress] = useState('');
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<DetectedFace[] | null>(null);
  const [refLabel, setRefLabel] = useState('');
  const [refThumb, setRefThumb] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const scanned = faces.length > 0;
  const busy = stage === 'models' || stage === 'scanning';

  async function ensureScanned(): Promise<boolean> {
    if (scanned) return true;
    setError(null);
    try {
      setStage('models');
      await loadModels((s) => setProgress(s));
      setStage('scanning');
      const result = await scanEventPhotos(photos, (done, total) =>
        setProgress(`Scanning photo ${done} of ${total}…`),
      );
      setFaces(result.faces);
      setUrls(result.urls);
      setStage('idle');
      setProgress('');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed.');
      setStage('idle');
      return false;
    }
  }

  async function handleSelfieUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    try {
      await loadModels();
      setProgress('Reading selfie…');
      const objectUrl = URL.createObjectURL(file);
      setSelfieUrl(objectUrl);
      const img = await loadImage(objectUrl);
      const detected = await detectFaces(img, 'selfie');
      if (detected.length === 0) {
        setError('No face found in that selfie — try a clearer photo.');
        setProgress('');
        return;
      }
      // largest face wins
      const largest = detected.reduce((a, b) =>
        a.box.width * a.box.height >= b.box.width * b.box.height ? a : b,
      );
      setReference(detected);
      setRefLabel(
        detected.length > 1
          ? `Selfie (${detected.length} faces found — matching the largest)`
          : 'Selfie',
      );
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const b = largest.box;
        const side = Math.max(b.width, b.height) * 1.8;
        ctx.drawImage(
          img,
          Math.max(0, b.x + b.width / 2 - side / 2),
          Math.max(0, b.y + b.height / 2 - side / 2),
          side,
          side,
          0,
          0,
          96,
          96,
        );
        setRefThumb(canvas.toDataURL('image/jpeg', 0.7));
      }
      setProgress('');
      await ensureScanned();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the selfie.');
      setProgress('');
    }
  }

  async function pickPersonCluster() {
    setError(null);
    const ok = await ensureScanned();
    if (!ok || faces.length === 0) {
      setError('No faces found in this event yet.');
      return;
    }
    const clusters = groupFaces(faces, 0.5);
    if (clusters.length === 0) {
      setError('No faces found in this event yet.');
      return;
    }
    // default: biggest cluster = most-photographed person
    setReference(clusters[0]);
    setRefLabel(`Person 1 (most photographed — ${clusters[0].length} faces)`);
    setRefThumb('');
    setSelfieUrl('');
  }

  function clearReference() {
    setReference(null);
    setRefLabel('');
    setRefThumb('');
    setSelfieUrl('');
  }

  const photoById: Record<string, ScanPhoto> = {};
  for (const p of photos) photoById[p.id] = p;

  let matches: Match[] = [];
  if (reference && reference.length > 0 && scanned) {
    const scored: Match[] = [];
    for (const face of faces) {
      let best = Infinity;
      for (const ref of reference) {
        const d = euclidean(face.descriptor, ref.descriptor);
        if (d < best) best = d;
      }
      if (best <= threshold) {
        const photo = photoById[face.photoId];
        if (photo) scored.push({ face, distance: best, photo });
      }
    }
    scored.sort((a, b) => a.distance - b.distance);
    // one entry per photo — keep the closest face per photo
    const seen = new Set<string>();
    matches = scored.filter((m) => {
      if (seen.has(m.photo.id)) return false;
      seen.add(m.photo.id);
      return true;
    });
  }

  const similarity = (d: number) => Math.max(0, Math.min(100, Math.round((1 - d) * 100)));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500">
          <Link href={`/studio/${eventId}`} className="hover:text-zinc-300">{eventName}</Link>
          {' / Search'}
        </p>
        <h1 className="text-2xl font-bold mt-1">Face search</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Upload a selfie — or pick the most-photographed person — and find every photo they appear
          in. Session-only: face data is never stored.
        </p>
      </div>

      {/* reference picker */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4 max-w-2xl">
        {!reference ? (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => selfieInputRef.current?.click()}
              disabled={busy}
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
            >
              Upload selfie
            </button>
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                handleSelfieUpload(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              onClick={pickPersonCluster}
              disabled={busy || photos.length === 0}
              className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:border-amber-400 disabled:opacity-40"
            >
              Use most-photographed person
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {(refThumb || selfieUrl) && (
              <img
                src={refThumb || selfieUrl}
                alt="Reference face"
                className="h-16 w-16 rounded-full object-cover border-2 border-amber-400"
              />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-100">Reference: {refLabel}</p>
              <button onClick={clearReference} className="text-xs text-zinc-400 hover:text-zinc-200 mt-1">
                Choose a different reference
              </button>
            </div>
          </div>
        )}

        {/* sensitivity slider */}
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
            <span>Strict</span>
            <span className="text-zinc-200 font-medium">Sensitivity: {threshold.toFixed(2)}</span>
            <span>Inclusive</span>
          </div>
          <input
            type="range"
            min={0.35}
            max={0.65}
            step={0.01}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Lower = only near-identical faces. Higher = catches more angles, with more false positives.
          </p>
        </div>
      </div>

      {progress && <p className="text-sm text-amber-300">{progress}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {reference && scanned && (
        <div>
          <p className="text-sm text-zinc-400 mb-3">
            {matches.length} matching photo{matches.length === 1 ? '' : 's'} — closest first
          </p>
          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-sm text-zinc-500">
              No matches at this sensitivity. Try moving the slider towards Inclusive.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {matches.map((m) => (
                <div key={m.photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900">
                  {urls[m.photo.id] ? (
                    <img src={urls[m.photo.id]} alt={m.photo.filename} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-zinc-800" />
                  )}
                  <div className="absolute top-2 left-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-bold text-zinc-950">
                    {similarity(m.distance)}%
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-1.5">
                    <span className="rounded bg-zinc-700/90 px-1.5 py-0.5 text-[10px] text-zinc-200">{m.photo.folderName}</span>
                    <p className="truncate text-[10px] text-zinc-300 mt-0.5">{m.photo.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
