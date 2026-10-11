'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SwitcherEvent {
  id: string;
  name: string;
  photoCount: number;
}

export default function EventSwitcher({ events }: { events: SwitcherEvent[] }) {
  const pathname = usePathname();
  const activeId = pathname.startsWith('/studio/') ? pathname.split('/')[2] : null;

  return (
    <div>
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Events
      </p>
      <div className="mt-2 flex flex-col gap-1 max-h-64 overflow-y-auto">
        {events.length === 0 && (
          <p className="px-3 py-1 text-xs text-zinc-600">No events yet</p>
        )}
        {events.map((e) => {
          const active = e.id === activeId;
          return (
            <Link
              key={e.id}
              href={`/studio/${e.id}`}
              title={e.name}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-amber-400/15 text-amber-200 font-medium'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span className="block truncate">{e.name}</span>
              <span className="block text-[11px] text-zinc-500">
                {e.photoCount} photo{e.photoCount === 1 ? '' : 's'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
