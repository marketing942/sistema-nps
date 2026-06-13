import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. NEVER expose to the browser.
 * Use only inside Route Handlers / Server Actions to bypass RLS
 * after validating input.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ausente — configure no .env / Vercel."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
