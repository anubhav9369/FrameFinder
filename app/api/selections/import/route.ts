import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/api-auth";
import { decodeSelection, type SelectionItem } from "@/lib/selection-codec";

interface ImportBody {
  eventId?: unknown;
  text?: unknown;
}

interface PhotoWithFolder {
  id: string;
  filename: string;
  folders: { name: string } | null;
}

interface MatchedPhoto {
  id: string;
  filename: string;
  folder: string;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { supabase } = session;

  const body = (await request.json()) as ImportBody;
  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  const text = typeof body.text === "string" ? body.text : "";
  if (!eventId || !text) {
    return NextResponse.json(
      { error: "eventId and text are required" },
      { status: 400 },
    );
  }

  const items = decodeSelection(text);
  if (!items) {
    return NextResponse.json({ error: "unrecognized_format" }, { status: 400 });
  }

  // Verify the event belongs to this user (RLS also enforces this on photos).
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (eventError || !event) {
    return NextResponse.json({ error: "event_not_found" }, { status: 404 });
  }

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("id, filename, folders(name)")
    .eq("event_id", eventId);

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  const photoRows = (photos ?? []) as unknown as PhotoWithFolder[];

  const matched: MatchedPhoto[] = [];
  const unmatched: string[] = [];

  for (const item of items) {
    const wantFile = item.filename.trim().toLowerCase();
    const wantFolder = item.folder.trim().toLowerCase();
    const hit = photoRows.find(
      (p) =>
        p.filename.trim().toLowerCase() === wantFile &&
        (p.folders?.name ?? "").trim().toLowerCase() === wantFolder,
    );
    if (hit) {
      matched.push({
        id: hit.id,
        filename: hit.filename,
        folder: hit.folders?.name ?? "",
      });
    } else {
      unmatched.push(`${item.folder} | ${item.filename}`);
    }
  }

  if (matched.length > 0) {
    const ids = matched.map((m) => m.id);
    const { error: starError } = await supabase
      .from("photos")
      .update({ starred: true })
      .in("id", ids);
    if (starError) {
      return NextResponse.json({ error: starError.message }, { status: 500 });
    }
  }

  const { error: insertError } = await supabase.from("selections").insert({
    event_id: eventId,
    source: "whatsapp",
    items: matched as unknown as SelectionItem[],
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ matched, unmatched });
}
