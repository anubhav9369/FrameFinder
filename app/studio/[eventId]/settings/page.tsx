import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { EventRow, FolderRow, PhotoRow } from '@/lib/studio-types';
import SettingsForm from './SettingsForm';
import ExportGalleryButton from './ExportGalleryButton';

export default async function SettingsPage({
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
    .select('id,folder_id,filename,storage_path')
    .eq('event_id', params.eventId)
    .order('created_at', { ascending: true });
  const photos = (photoData ?? []) as PhotoRow[];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Event details, selling prices and the client gallery export.
        </p>
      </div>
      <SettingsForm event={event} />
      <ExportGalleryButton event={event} folders={folders} photos={photos} />
    </div>
  );
}
