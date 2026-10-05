import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/api-auth";
import { getEntitlement } from "@/lib/entitlements";
import type { PhotoRow } from "@/lib/types";

interface CreatePhotoBody {
  eventId?: unknown;
  folderId?: unknown;
  storage_path?: unknown;
  filename?: unknown;
  file_size?: unknown;
  width?: unknown;
  height?: unknown;
  faces_count?: unknown;
}

function toNullableInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { supabase, user } = session;

  const body = (await request.json()) as CreatePhotoBody;
  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  const storagePath = typeof body.storage_path === "string" ? body.storage_path.trim() : "";
  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  if (!eventId || !storagePath || !filename) {
    return NextResponse.json(
      { error: "eventId, storage_path and filename are required" },
      { status: 400 },
    );
  }

  // Verify the event belongs to this user.
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (eventError || !event) {
    return NextResponse.json({ error: "event_not_found" }, { status: 404 });
  }

  // Verify the folder (if given) belongs to the event.
  const folderId = typeof body.folderId === "string" && body.folderId ? body.folderId : null;
  if (folderId) {
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("event_id", eventId)
      .maybeSingle();
    if (folderError || !folder) {
      return NextResponse.json({ error: "folder_not_found" }, { status: 404 });
    }
  }

  // Server-side quota check: never trust the client.
  const entitlement = await getEntitlement(supabase, user.id);
  if (entitlement.photosUsed >= entitlement.photoLimit) {
    return NextResponse.json(
      { error: "photo_quota_exceeded", upgrade: "/pricing" },
      { status: 402 },
    );
  }

  const facesCount = toNullableInt(body.faces_count) ?? 0;
  const { data, error } = await supabase
    .from("photos")
    .insert({
      event_id: eventId,
      folder_id: folderId,
      owner_id: user.id,
      storage_path: storagePath,
      filename,
      file_size: toNullableInt(body.file_size),
      width: toNullableInt(body.width),
      height: toNullableInt(body.height),
      faces_count: facesCount,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ photo: data as PhotoRow }, { status: 201 });
}
