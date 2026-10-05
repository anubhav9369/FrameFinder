import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { EventRow, FolderRow, PhotoRow } from '@/lib/studio-types';
import SelectedManager from './SelectedManager';

export default async function SelectedPage({
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
    .select('*')
    .eq('id', params.eventId)
    .eq('user_id', user.id)
    .single();
  if (!eventData) notFound();
  const event = eventData as EventRow;

  const { data: folderData } = await supabase
    .from('folders')
    .select('*')
    .eq('event_id', params.eventId);
  const folders = (folderData ?? []) as FolderRow[];

  const { data: photoData } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', params.eventId)
    .eq('starred', true)
    .order('created_at', { ascending: true });
  const photos = (photoData ?? []) as PhotoRow[];

  return <SelectedManager event={event} folders={folders} initialPhotos={photos} />;
}
