// Server-side Supabase client (RSC, route handlers, server actions).
// Reads/writes the auth cookies via next/headers.
//
// See lib/supabase/client.ts for why we don't pass <Database>.
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // RSC: setting cookies is a no-op here, handled by middleware.
          }
        },
      },
    },
  );
}
