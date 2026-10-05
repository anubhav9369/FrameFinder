import { NextResponse } from "next/server";
import { getSession, unauthorized, type Session } from "@/lib/api-auth";
import type { FolderRow } from "@/lib/types";

interface RouteParams {
  params: { id: string };
}

interface FolderWithEvent {
  id: string;
  events: { owner_id: string } | null;
}

/** Verify folder ownership through the event join. */
async function getOwnedFolder(
  session: Session,
  id: string,
): Promise<FolderWithEvent | null> {
  const { data, error } = await session.supabase
    .from("folders")
    .select("id, events!inner(owner_id)")
    .eq("id", id)
    .eq("events.owner_id", session.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as FolderWithEvent;
}

interface UpdateFolderBody {
  name?: unknown;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return unauthorized();

  const folder = await getOwnedFolder(session, params.id);
  if (!folder) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await request.json()) as UpdateFolderBody;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error } = await session.supabase
    .from("folders")
    .update({ name })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ folder: data as FolderRow });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return unauthorized();

  const folder = await getOwnedFolder(session, params.id);
  if (!folder) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error } = await session.supabase.from("folders").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
