import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await supabase
        .from("profiles")
        .upsert({ id: data.user.id, email: data.user.email ?? "" }, { onConflict: "id" });
      return NextResponse.redirect(`${origin}/studio`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
