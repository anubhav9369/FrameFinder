import type { SupabaseClient } from '@supabase/supabase-js';
import { planById } from './plans';

export interface Entitlement {
  planId: string;
  planName: string;
  eventsUsed: number;
  photosUsed: number;
  eventLimit: number;
  photoLimit: number;
  canCreateEvent: boolean;
}

export async function getEntitlement(
  supabase: SupabaseClient,
  userId: string,
): Promise<Entitlement> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const plan = (sub?.plan_id && planById(sub.plan_id)) || planById('free')!;
  const { count: eventsUsed } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);
  const { count: photosUsed } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);
  const e = eventsUsed ?? 0;
  const p = photosUsed ?? 0;
  return {
    planId: plan.id,
    planName: plan.name,
    eventsUsed: e,
    photosUsed: p,
    eventLimit: plan.limits.events,
    photoLimit: plan.limits.photos,
    canCreateEvent: e < plan.limits.events,
  };
}
