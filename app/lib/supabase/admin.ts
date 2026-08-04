import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely. Only use for narrow,
 * specific lookups that must succeed regardless of the calling user's
 * own permissions (e.g. "who is the platform admin" during signup,
 * when the caller has no company and no elevated access yet).
 *
 * Never expose this client or return its raw results beyond what's
 * strictly needed — it can see every row in every table.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing TC Applicator Supabase service-role environment variables."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}