// Shared helper: signed-URL + face detection over an event's photos.
// Session-only: results live in memory, nothing is persisted.

import { createClient } from '@/lib/supabase/client';
import { detectFaces, loadImage, type DetectedFace } from './face';

export interface ScanInput {
  id: string;
  storage_path: string;
}

export interface ScanResult {
  faces: DetectedFace[];
  urls: Record<string, string>;
}

export async function scanEventPhotos(
  photos: ScanInput[],
  onProgress?: (done: number, total: number) => void,
): Promise<ScanResult> {
  const supabase = createClient();
  const faces: DetectedFace[] = [];
  const urls: Record<string, string> = {};
  let n = 0;
  for (const p of photos) {
    n++;
    onProgress?.(n, photos.length);
    const { data, error } = await supabase.storage
      .from('event-photos')
      .createSignedUrl(p.storage_path, 3600);
    if (error || !data?.signedUrl) continue;
    urls[p.id] = data.signedUrl;
    try {
      const img = await loadImage(data.signedUrl);
      const detected = await detectFaces(img, p.id);
      faces.push(...detected);
    } catch {
      // skip unreadable photos
    }
  }
  return { faces, urls };
}
