import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { EventRow } from '@/lib/studio-types';
import NewEventForm from './NewEventForm';

interface EventWithCounts extends EventRow {
  folders_count: number;
  photos_count: number;
}

export default async function StudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let events: EventWithCounts[] = [];
  if (user) {
    const { data } = await supabase
      .from('events')
      .select('*, folders(count), photos(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    events = ((data ?? []) as Array<EventRow & { folders: { count: number }[]; photos: { count: number }[] }>).map(
      (e) => ({
        id: e.id,
        name: e.name,
        location: e.location,
        event_date: e.event_date,
        photographer_whatsapp: e.photographer_whatsapp,
        price_per_photo: e.price_per_photo,
        event_price: e.event_price,
        watermark_text: e.watermark_text,
        created_at: e.created_at,
        folders_count: e.folders?.[0]?.count ?? 0,
        photos_count: e.photos?.[0]?.count ?? 0,
      }),
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Your events</h1>
          <p className="text-sm text-zinc-400 mt-1">
            One event = one shoot. Upload photos, organise ceremonies, let clients pick.
          </p>
        </div>
        <NewEventForm />
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 p-12 text-center">
          <p className="text-lg font-medium text-zinc-300">No events yet</p>
          <p className="text-sm text-zinc-500 mt-2">
            Create your first event to start uploading photos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/studio/${event.id}`}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-amber-400/60 transition-colors"
            >
              <h2 className="font-semibold text-lg truncate">{event.name}</h2>
              <p className="text-xs text-zinc-500 mt-1">
                {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date set'}
                {event.location ? ` · ${event.location}` : ''}
              </p>
              <div className="flex gap-4 mt-4 text-sm text-zinc-400">
                <span>
                  <span className="font-bold text-zinc-100">{event.folders_count}</span> folders
                </span>
                <span>
                  <span className="font-bold text-zinc-100">{event.photos_count}</span> photos
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
