import { NextResponse } from "next/server";
import { getSession, unauthorized, type Session } from "@/lib/api-auth";
import type { PhotoRow } from "@/lib/types";

interface RouteParams {
  params: { id: string };
}

const BUCKET = "event-photos";

async function getOwnedPhoto(session: Session, id: string): Promise<PhotoRow | null> {
  const { data, error } = await session.supabase
    .from("photos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as PhotoRow;
}

interface UpdatePhotoBody {
  starred?: unknown;
  folderId?: unknown;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return unauthorized();

  const photo = await getOwnedPhoto(session, params.id);
  if (!photo) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await request.json()) as UpdatePhotoBody;
  const patch: { starred?: boolean; folder_id?: string | null } = {};
  if (body.starred !== undefined) patch.starred = body.starred === true;

  if (body.folderId !== undefined) {
    if (body.folderId === null) {
      patch.folder_id = null;
    } else if (typeof body.folderId === "string") {
      // The target folder must belong to the same event (ownership via event).
      const { data: folder, error: folderError } = await session.supabase
        .from("folders")
        .select("id, event_id")
        .eq("id", body.folderId)
        .maybeSingle();
      if (folderError || !folder || (folder as { event_id: string }).event_id !== photo.event_id) {
        return NextResponse.json({ error: "invalid_folder" }, { status: 400 });
      }
      patch.folder_id = body.folderId;
    } else {
      return NextResponse.json({ error: "invalid_folder" }, { status: 400 });
    }
  }

  const { data, error } = await session.supabase
    .from("photos")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ photo: data as PhotoRow });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return unauthorized();

  const photo = await getOwnedPhoto(session, params.id);
  if (!photo) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Remove the storage object first (RLS policy allows owners), then the row.
  const { error: storageError } = await session.supabase.storage
    .from(BUCKET)
    .remove([photo.storage_path]);
  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { error } = await session.supabase.from("photos").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
