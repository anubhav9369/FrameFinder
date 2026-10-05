import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEntitlement } from '@/lib/entitlements';
import SignOutButton from './SignOutButton';

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const entitlement = await getEntitlement(supabase, user.id);

  const nav = [
    { href: '/studio', label: 'Events' },
    { href: '/pricing', label: 'Billing' },
    { href: '/', label: '← Back to website' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <aside className="w-60 shrink-0 border-r border-zinc-800 bg-zinc-900/60 p-5 flex flex-col gap-6">
        <Link href="/studio" className="text-xl font-bold tracking-tight">
          FrameFinder <span className="text-amber-400">Studio</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-zinc-800 pt-4">
          <div className="rounded-lg bg-zinc-800/70 px-3 py-2">
            <p className="text-xs text-zinc-400">Current plan</p>
            <p className="text-sm font-semibold text-amber-300">{entitlement.planName}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {entitlement.eventsUsed}/{entitlement.eventLimit === Infinity ? '∞' : entitlement.eventLimit} events ·{' '}
              {entitlement.photosUsed}/{entitlement.photoLimit === Infinity ? '∞' : entitlement.photoLimit} photos
            </p>
          </div>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 md:p-10">{children}</main>
    </div>
  );
}
