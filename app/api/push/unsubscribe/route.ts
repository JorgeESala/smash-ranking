import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const endpoint: string | undefined = body?.endpoint;
  if (!endpoint) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subs")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
