// Service-role Supabase client. Bypasses RLS — server-only use.
// NEVER import this from a Client Component or expose to the browser.
import { createClient as createBaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createServiceClient() {
  return createBaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
