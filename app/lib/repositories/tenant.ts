import "server-only";

import { createClient } from "@/app/lib/supabase/server";

/**
 * Just the signed-in user — no profile required. Use this for anything
 * that has to work BEFORE a user has been approved (submitting a
 * signup request, checking your own request's status).
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to do that.");
  }

  return { supabase, user };
}

/**
 * Every company-scoped repository function should start here. Throws
 * if there's no signed-in user, or no profiles row linking them to a
 * company yet (which is the state a user is in until an admin or
 * platform admin approves their signup request).
 */
export async function getCurrentUserAndCompany() {
  const { supabase, user } = await getCurrentUser();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, full_name, is_admin, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(
      "Your account isn't linked to a company yet — ask an admin to set that up."
    );
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name, logo_url")
    .eq("id", profile.company_id)
    .maybeSingle();

  return {
    supabase,
    user,
    companyId: profile.company_id as string,
    companyName: company?.name ?? "",
    companyLogoPath: company?.logo_url ?? null,
    fullName: profile.full_name as string | null,
    isAdmin: Boolean(profile.is_admin),
    isPlatformAdmin: Boolean(profile.is_platform_admin),
  };
}