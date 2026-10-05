import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/api-auth";
import type { EventRow } from "@/lib/types";

interface RouteParams {
  params: { id: string };
}

async function getOwnedEvent(
  session: Awaited<ReturnType<typeof getSession>>,
  id: string,
): Promise<EventRow | null> {
  if (!session) return null;
  const { data, error } = await session.supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as EventRow;
}

interface UpdateEventBody {
  name?: unknown;
  location?: unknown;
  event_date?: unknown;
  photographer_whatsapp?: unknown;
  price_per_photo?: unknown;
  event_price?: unknown;
  watermark_text?: unknown;
}

function toNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return unauthorized();

  const existing = await getOwnedEvent(session, params.id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await request.json()) as UpdateEventBody;
  const patch: Record<string, string | number | null> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (body.location !== undefined)
    patch.location = typeof body.location === "string" ? body.location.trim() || null : null;
  if (body.event_date !== undefined)
    patch.event_date = typeof body.event_date === "string" ? body.event_date || null : null;
  if (body.photographer_whatsapp !== undefined)
    patch.photographer_whatsapp =
      typeof body.photographer_whatsapp === "string"
        ? body.photographer_whatsapp.trim() || null
        : null;
  if (body.price_per_photo !== undefined) patch.price_per_photo = toNullableNumber(body.price_per_photo);
  if (body.event_price !== undefined) patch.event_price = toNullableNumber(body.event_price);
  if (body.watermark_text !== undefined)
    patch.watermark_text =
      typeof body.watermark_text === "string" ? body.watermark_text.trim() || null : null;

  const { data, error } = await session.supabase
    .from("events")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ event: data as EventRow });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return unauthorized();

  const existing = await getOwnedEvent(session, params.id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error } = await session.supabase.from("events").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
