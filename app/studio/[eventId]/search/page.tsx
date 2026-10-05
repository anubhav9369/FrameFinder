import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { FolderRow, PhotoRow } from '@/lib/studio-types';
import FaceSearch from './FaceSearch';
import type { ScanPhoto } from '../people/page';

export default async function SearchPage({
  params,
}: {
  params: { eventId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: eventData } = await supabase
    .from('events')
    .select('id,name')
    .eq('id', params.eventId)
    .eq('user_id', user.id)
    .single();
  if (!eventData) notFound();

  const { data: folderData } = await supabase
    .from('folders')
    .select('*')
    .eq('event_id', params.eventId);
  const folderNames: Record<string, string> = {};
  for (const f of (folderData ?? []) as FolderRow[]) folderNames[f.id] = f.name;

  const { data: photoData } = await supabase
    .from('photos')
    .select('id,storage_path,filename,folder_id')
    .eq('event_id', params.eventId)
    .order('created_at', { ascending: true });
  const photos: ScanPhoto[] = ((photoData ?? []) as PhotoRow[]).map((p) => ({
    id: p.id,
    storage_path: p.storage_path,
    filename: p.filename,
    folderName: p.folder_id ? (folderNames[p.folder_id] ?? 'Unfiled') : 'Unfiled',
  }));

  return (
    <FaceSearch
      eventId={params.eventId}
      eventName={(eventData as { name: string }).name}
      photos={photos}
    />
  );
}
