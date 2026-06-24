import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const endpoint: string | undefined = body?.endpoint;
  const p256dh: string | undefined = body?.keys?.p256dh;
  const auth: string | undefined = body?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { error } = await admin
    .from("push_subs")
    .upsert(
      { user_id: user.id, endpoint, p256dh, auth },
      { onConflict: "endpoint" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
