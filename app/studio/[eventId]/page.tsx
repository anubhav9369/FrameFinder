import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { EventRow, FolderRow, PhotoRow } from '@/lib/studio-types';
import EventWorkspace from './EventWorkspace';

export default async function EventPage({
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
    .eq('event_id', params.eventId)
    .order('created_at', { ascending: true });
  const folders = (folderData ?? []) as FolderRow[];

  const { data: photoData } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', params.eventId)
    .order('created_at', { ascending: true });
  const photos = (photoData ?? []) as PhotoRow[];

  return (
    <EventWorkspace
      event={event}
      folders={folders}
      photos={photos}
      userId={user.id}
    />
  );
}
