import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/api-auth";
import { getEntitlement } from "@/lib/entitlements";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const { supabase, user } = session;

  const entitlement = await getEntitlement(supabase, user.id);
  return NextResponse.json(entitlement);
}
