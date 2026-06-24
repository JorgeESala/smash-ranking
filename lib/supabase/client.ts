// Browser-side Supabase client. Uses @supabase/ssr to keep cookies in sync.
//
// We don't pass <Database> as a generic because the hand-rolled types in
// types.ts cause supabase-js v2.108's type inference to fall back to `never`
// for joined selects. To re-enable full type safety, run
// `supabase gen types typescript --linked > lib/supabase/types.gen.ts` and
// pass <Database> here.
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
