import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/api-auth";
import type { FolderRow } from "@/lib/types";

interface CreateFolderBody {
  eventId?: unknown;
  name?: unknown;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { supabase } = session;

  const body = (await request.json()) as CreateFolderBody;
  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!eventId || !name) {
    return NextResponse.json(
      { error: "eventId and name are required" },
      { status: 400 },
    );
  }

  // Verify the event belongs to this user (RLS also enforces this).
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (eventError || !event) {
    return NextResponse.json({ error: "event_not_found" }, { status: 404 });
  }

  const { data: last } = await supabase
    .from("folders")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (last as { sort_order: number } | null)?.sort_order ?? -1;

  const { data, error } = await supabase
    .from("folders")
    .insert({ event_id: eventId, name, sort_order: sortOrder + 1 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ folder: data as FolderRow }, { status: 201 });
}
