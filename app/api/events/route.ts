import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/api-auth";
import { getEntitlement } from "@/lib/entitlements";
import type { EventRow } from "@/lib/types";

interface CountEmbed {
  count: number;
}

interface EventWithCounts extends EventRow {
  folders: CountEmbed[];
  photos: CountEmbed[];
}

export interface EventSummary extends EventRow {
  folderCount: number;
  photoCount: number;
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const { supabase, user } = session;

  const { data, error } = await supabase
    .from("events")
    .select("*, folders(count), photos(count)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events: EventSummary[] = ((data ?? []) as EventWithCounts[]).map((e) => ({
    id: e.id,
    owner_id: e.owner_id,
    name: e.name,
    location: e.location,
    event_date: e.event_date,
    photographer_whatsapp: e.photographer_whatsapp,
    price_per_photo: e.price_per_photo,
    event_price: e.event_price,
    watermark_text: e.watermark_text,
    created_at: e.created_at,
    folderCount: e.folders?.[0]?.count ?? 0,
    photoCount: e.photos?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ events });
}

interface CreateEventBody {
  name?: unknown;
  location?: unknown;
  event_date?: unknown;
  photographer_whatsapp?: unknown;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { supabase, user } = session;

  const body = (await request.json()) as CreateEventBody;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Server-side quota check: never trust the client.
  const entitlement = await getEntitlement(supabase, user.id);
  if (!entitlement.canCreateEvent) {
    return NextResponse.json(
      { error: "event_quota_exceeded", upgrade: "/pricing" },
      { status: 402 },
    );
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      owner_id: user.id,
      name,
      location: typeof body.location === "string" ? body.location.trim() || null : null,
      event_date: typeof body.event_date === "string" ? body.event_date || null : null,
      photographer_whatsapp:
        typeof body.photographer_whatsapp === "string"
          ? body.photographer_whatsapp.trim() || null
          : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data as EventRow }, { status: 201 });
}
