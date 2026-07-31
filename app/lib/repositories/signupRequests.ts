import "server-only";

import { getCurrentUser, getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";

export type SignupRequestStatus = "pending" | "approved" | "rejected";

export type SignupRequestRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  requested_company_name: string;
  requested_company_id: string | null;
  platform_approved_by: string | null;
  platform_approved_at: string | null;
  manager_approved_by: string | null;
  manager_approved_at: string | null;
  status: SignupRequestStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

/** Called right after auth.signUp() — the user has a session but no profile yet. */
export async function createSignupRequest(input: {
  fullName: string;
  email: string;
  requestedCompanyName: string;
}) {
  const { supabase, user } = await getCurrentUser();

  const { data, error } = await supabase
    .from("signup_requests")
    .insert({
      user_id: user.id,
      full_name: input.fullName.trim(),
      email: input.email.trim(),
      requested_company_name: input.requestedCompanyName.trim(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("You already have a pending access request.");
    }
    throw new Error(`Unable to submit signup request: ${error.message}`);
  }

  return data as SignupRequestRow;
}

/** For the "awaiting approval" holding page — works with no profile yet. */
export async function getOwnSignupRequest() {
  const { supabase, user } = await getCurrentUser();

  const { data, error } = await supabase
    .from("signup_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load your signup request: ${error.message}`);
  }

  return data as SignupRequestRow | null;
}

/**
 * Same as getOwnSignupRequest, but if no request exists yet AND this
 * user's auth metadata has the name/company they typed at signup
 * (stashed there because "Confirm email" is on, so no session existed
 * to create the request at signup time), create it now — this is the
 * first moment after email confirmation that a session actually
 * exists to do that under.
 */
export async function ensureOwnSignupRequest() {
  const { supabase, user } = await getCurrentUser();

  const { data: existing, error } = await supabase
    .from("signup_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load your signup request: ${error.message}`);
  }

  if (existing) {
    return existing as SignupRequestRow;
  }

  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
  const requestedCompanyName = (
    user.user_metadata?.requested_company_name as string | undefined
  )?.trim();

  if (!fullName || !requestedCompanyName) {
    return null; // nothing on file to auto-create a request from
  }

  const { data: created, error: insertError } = await supabase
    .from("signup_requests")
    .insert({
      user_id: user.id,
      full_name: fullName,
      email: user.email ?? "",
      requested_company_name: requestedCompanyName,
    })
    .select("*")
    .single();

  if (insertError) {
    // A concurrent request (e.g. two tabs) may have just created it —
    // re-read rather than fail.
    if (insertError.code === "23505") {
      const { data: retry } = await supabase
        .from("signup_requests")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return (retry as SignupRequestRow) ?? null;
    }
    throw new Error(`Unable to submit signup request: ${insertError.message}`);
  }

  return created as SignupRequestRow;
}

// ---------- Platform admin (TC Applicator Support) ----------

export async function listPlatformPendingRequests() {
  const { supabase, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    throw new Error("Only TC Applicator Support can view this.");
  }

  const { data, error } = await supabase
    .from("signup_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load signup requests: ${error.message}`);
  }

  return (data ?? []) as SignupRequestRow[];
}

export async function listCompaniesForAssignment() {
  const { supabase, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    throw new Error("Only TC Applicator Support can view this.");
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .order("name");

  if (error) {
    throw new Error(`Unable to load companies: ${error.message}`);
  }

  return (data ?? []) as { id: string; name: string }[];
}

export async function createCompany(name: string) {
  const { supabase, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    throw new Error("Only TC Applicator Support can create a company.");
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({ name: name.trim() })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A company with that name already exists.");
    }
    throw new Error(`Unable to create company: ${error.message}`);
  }

  return data as { id: string; name: string };
}

async function countCompanyMembers(
  supabase: Awaited<ReturnType<typeof getCurrentUser>>["supabase"],
  companyId: string
) {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (error) {
    throw new Error(`Unable to check company membership: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Runs after either approval is recorded. Creates the real profiles
 * row and marks the request approved once BOTH approvals are in place
 * — except for a brand-new company with zero existing members, where
 * there's no manager to ask, so platform approval alone is enough and
 * that first user becomes the company's first admin.
 */
async function finalizeIfReady(requestId: string) {
  const { supabase } = await getCurrentUserAndCompany();

  const { data: request, error } = await supabase
    .from("signup_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !request) {
    return;
  }

  const row = request as SignupRequestRow;

  if (row.status !== "pending" || !row.requested_company_id || !row.platform_approved_at) {
    return;
  }

  const memberCount = await countCompanyMembers(supabase, row.requested_company_id);
  const isBootstrapAdmin = memberCount === 0;

  if (!row.manager_approved_at && !isBootstrapAdmin) {
    return; // still waiting on that company's manager
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: row.user_id,
    company_id: row.requested_company_id,
    full_name: row.full_name,
    is_admin: isBootstrapAdmin,
  });

  if (profileError) {
    throw new Error(`Unable to finalize signup: ${profileError.message}`);
  }

  const { error: updateError } = await supabase
    .from("signup_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Unable to finalize signup: ${updateError.message}`);
  }
}

export async function platformApprove(requestId: string, companyId: string) {
  const { supabase, user, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    throw new Error("Only TC Applicator Support can approve at this stage.");
  }

  const { error } = await supabase
    .from("signup_requests")
    .update({
      requested_company_id: companyId,
      platform_approved_by: user.id,
      platform_approved_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Unable to approve request: ${error.message}`);
  }

  await finalizeIfReady(requestId);
}

export async function platformReject(requestId: string, reason: string) {
  const { supabase, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    throw new Error("Only TC Applicator Support can reject at this stage.");
  }

  const { error } = await supabase
    .from("signup_requests")
    .update({ status: "rejected", rejection_reason: reason.trim() || null })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Unable to reject request: ${error.message}`);
  }
}

// ---------- Company manager (second-stage approval) ----------

export async function listCompanyPendingRequests() {
  const { supabase, companyId, isAdmin } = await getCurrentUserAndCompany();

  if (!isAdmin) {
    throw new Error("Only a company admin can view this.");
  }

  const { data, error } = await supabase
    .from("signup_requests")
    .select("*")
    .eq("requested_company_id", companyId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load requests: ${error.message}`);
  }

  return (data ?? []) as SignupRequestRow[];
}

export async function managerApprove(requestId: string) {
  const { supabase, user, companyId, isAdmin } = await getCurrentUserAndCompany();

  if (!isAdmin) {
    throw new Error("Only a company admin can approve this.");
  }

  const { error } = await supabase
    .from("signup_requests")
    .update({
      manager_approved_by: user.id,
      manager_approved_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("requested_company_id", companyId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Unable to approve request: ${error.message}`);
  }

  await finalizeIfReady(requestId);
}

export async function managerReject(requestId: string, reason: string) {
  const { supabase, companyId, isAdmin } = await getCurrentUserAndCompany();

  if (!isAdmin) {
    throw new Error("Only a company admin can reject this.");
  }

  const { error } = await supabase
    .from("signup_requests")
    .update({ status: "rejected", rejection_reason: reason.trim() || null })
    .eq("id", requestId)
    .eq("requested_company_id", companyId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Unable to reject request: ${error.message}`);
  }
}