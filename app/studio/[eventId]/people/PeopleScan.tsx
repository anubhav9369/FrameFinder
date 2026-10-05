'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  loadModels,
  detectFaces,
  groupFaces,
  loadImage,
  type DetectedFace,
} from '@/lib/face';
import type { ScanPhoto } from './page';

interface Person {
  faces: DetectedFace[];
  thumb: string;
}

function faceThumb(img: HTMLImageElement, face: DetectedFace): string {
  const pad = 0.6;
  const sx = Math.max(0, face.box.x - face.box.width * pad);
  const sy = Math.max(0, face.box.y - face.box.height * pad);
  const sw = Math.min(img.width - sx, face.box.width * (1 + pad * 2));
  const sh = Math.min(img.height - sy, face.box.height * (1 + pad * 2));
  const canvas = document.createElement('canvas');
  const size = 160;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  // square crop centred on the face
  const side = Math.max(sw, sh);
  const cx = sx + sw / 2;
  const cy = sy + sh / 2;
  ctx.drawImage(
    img,
    Math.max(0, cx - side / 2),
    Math.max(0, cy - side / 2),
    side,
    side,
    0,
    0,
    size,
    size,
  );
  return canvas.toDataURL('image/jpeg', 0.7);
}

export default function PeopleScan({
  eventId,
  eventName,
  photos,
}: {
  eventId: string;
  eventName: string;
  photos: ScanPhoto[];
}) {
  const [stage, setStage] = useState<string>('idle');
  const [progress, setProgress] = useState('');
  const [persons, setPersons] = useState<Person[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [openPerson, setOpenPerson] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    setError(null);
    setPersons([]);
    setOpenPerson(null);
    try {
      setStage('models');
      await loadModels((s) => setProgress(s));
      const supabase = createClient();
      const allFaces: DetectedFace[] = [];
      const images: Record<string, HTMLImageElement> = {};
      const urlMap: Record<string, string> = {};
      setStage('scanning');
      let n = 0;
      for (const p of photos) {
        n++;
        setProgress(`Scanning photo ${n} of ${photos.length}…`);
        const { data, error: urlErr } = await supabase.storage
          .from('event-photos')
          .createSignedUrl(p.storage_path, 3600);
        if (urlErr || !data?.signedUrl) continue;
        urlMap[p.id] = data.signedUrl;
        try {
          const img = await loadImage(data.signedUrl);
          images[p.id] = img;
          const faces = await detectFaces(img, p.id);
          allFaces.push(...faces);
        } catch {
          // skip unreadable photos
        }
      }
      setUrls(urlMap);
      setStage('grouping');
      setProgress('Grouping similar faces…');
      const clusters = groupFaces(allFaces, 0.5);
      const people: Person[] = clusters
        .map((faces) => {
          const first = faces[0];
          const img = images[first.photoId];
          return {
            faces,
            thumb: img ? faceThumb(img, first) : '',
          };
        })
        .filter((p) => p.thumb !== '');
      setPersons(people);
      setStage('done');
      setProgress('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Face scan failed.');
      setStage('idle');
    }
  }

  const busy = stage === 'models' || stage === 'scanning' || stage === 'grouping';
  const photoById: Record<string, ScanPhoto> = {};
  for (const p of photos) photoById[p.id] = p;

  const openFaces = openPerson !== null ? persons[openPerson].faces : [];
  const openPhotoIds = Array.from(new Set(openFaces.map((f) => f.photoId)));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500">
          <Link href={`/studio/${eventId}`} className="hover:text-zinc-300">{eventName}</Link>
          {' / People'}
        </p>
        <h1 className="text-2xl font-bold mt-1">People</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Find every face in this event and group them by person. Face data is session-only in this
          build — nothing is stored, so scan again whenever you reload.
        </p>
      </div>

      <button
        onClick={scan}
        disabled={busy || photos.length === 0}
        className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
      >
        {busy ? 'Scanning…' : 'Scan faces'}
      </button>
      {photos.length === 0 && (
        <p className="text-sm text-zinc-500">Upload photos to the event first.</p>
      )}
      {progress && <p className="text-sm text-amber-300">{progress}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {stage === 'done' && (
        <p className="text-sm text-zinc-400">
          Found {persons.length} {persons.length === 1 ? 'person' : 'people'} across {photos.length} photos.
        </p>
      )}

      {persons.length > 0 && openPerson === null && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {persons.map((person, i) => (
            <button
              key={i}
              onClick={() => setOpenPerson(i)}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 hover:border-amber-400/60 transition-colors"
            >
              <img src={person.thumb} alt={`Person ${i + 1}`} className="aspect-square w-full rounded-xl object-cover" />
              <p className="mt-2 text-sm font-medium">Person {i + 1}</p>
              <p className="text-xs text-zinc-500">
                {new Set(person.faces.map((f) => f.photoId)).size} photos
              </p>
            </button>
          ))}
        </div>
      )}

      {openPerson !== null && persons[openPerson] && (
        <div>
          <button onClick={() => setOpenPerson(null)} className="text-sm text-amber-300 hover:text-amber-200 mb-4">
            ← All people
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {openPhotoIds.map((id) => {
              const p = photoById[id];
              if (!p) return null;
              return (
                <div key={id} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900">
                  {urls[id] ? (
                    <img src={urls[id]} alt={p.filename} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-zinc-800" />
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-1.5">
                    <span className="rounded bg-zinc-700/90 px-1.5 py-0.5 text-[10px] text-zinc-200">{p.folderName}</span>
                    <p className="truncate text-[10px] text-zinc-300 mt-0.5">{p.filename}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
