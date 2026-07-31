import "server-only";

import { getCurrentUser, getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { sendEmail, emailTemplate, APP_URL } from "@/app/lib/email/brevo";

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

type Supabase = Awaited<ReturnType<typeof getCurrentUser>>["supabase"];

export async function getPlatformAdminEmails(supabase: Supabase) {
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("is_platform_admin", true)
    .eq("notify_by_email", true)
    .not("email", "is", null);

  if (error) {
    console.error("[email] Unable to load platform admin emails:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.email as string).filter(Boolean);
}

export async function getCompanyAdminEmails(supabase: Supabase, companyId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("company_id", companyId)
    .eq("is_admin", true)
    .eq("notify_by_email", true)
    .not("email", "is", null);

  if (error) {
    console.error("[email] Unable to load company admin emails:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.email as string).filter(Boolean);
}

async function notifyNewSignupRequest(
  supabase: Supabase,
  request: SignupRequestRow
) {
  const recipients = await getPlatformAdminEmails(supabase);

  if (recipients.length === 0) {
    return;
  }

  await sendEmail({
    to: recipients,
    subject: `New access request — ${request.full_name} (${request.requested_company_name})`,
    html: emailTemplate({
      title: "New signup request",
      bodyHtml: `
        <p><strong>${request.full_name}</strong> (${request.email}) has requested access to TC Applicator, for <strong>${request.requested_company_name}</strong>.</p>
        <p>Review it to assign a company and approve at the platform level.</p>
      `,
      ctaText: "Review request",
      ctaUrl: `${APP_URL}/admin/signups`,
    }),
  });
}

async function notifyCompanyManagers(supabase: Supabase, request: SignupRequestRow) {
  if (!request.requested_company_id) {
    return;
  }

  const recipients = await getCompanyAdminEmails(supabase, request.requested_company_id);

  if (recipients.length === 0) {
    return;
  }

  await sendEmail({
    to: recipients,
    subject: `Team access request awaiting your approval — ${request.full_name}`,
    html: emailTemplate({
      title: "New team member awaiting approval",
      bodyHtml: `
        <p><strong>${request.full_name}</strong> (${request.email}) has been approved by TC Applicator Support and is waiting on your approval to join your company.</p>
      `,
      ctaText: "Review request",
      ctaUrl: `${APP_URL}/team-requests`,
    }),
  });
}

async function notifyRequesterApproved(request: SignupRequestRow) {
  await sendEmail({
    to: request.email,
    subject: "Your TC Applicator access has been approved",
    html: emailTemplate({
      title: "You're in",
      bodyHtml: `
        <p>Hi ${request.full_name},</p>
        <p>Your access to TC Applicator has been approved. You can sign in now.</p>
      `,
      ctaText: "Sign In",
      ctaUrl: `${APP_URL}/login`,
    }),
  });
}

async function notifyRequesterRejected(request: SignupRequestRow, reason: string) {
  await sendEmail({
    to: request.email,
    subject: "Your TC Applicator access request",
    html: emailTemplate({
      title: "Access request not approved",
      bodyHtml: `
        <p>Hi ${request.full_name},</p>
        <p>Your request to join TC Applicator wasn't approved.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      `,
    }),
  });
}

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

  const request = data as SignupRequestRow;
  await notifyNewSignupRequest(supabase, request);

  return request;
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

  const request = created as SignupRequestRow;
  await notifyNewSignupRequest(supabase, request);

  return request;
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

async function countCompanyMembers(supabase: Supabase, companyId: string) {
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
 * that first user becomes the company's first admin. Returns whether
 * it actually finalized, so callers know which notification to send.
 */
async function finalizeIfReady(requestId: string): Promise<boolean> {
  const { supabase } = await getCurrentUserAndCompany();

  const { data: request, error } = await supabase
    .from("signup_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !request) {
    return false;
  }

  const row = request as SignupRequestRow;

  if (row.status !== "pending" || !row.requested_company_id || !row.platform_approved_at) {
    return false;
  }

  const memberCount = await countCompanyMembers(supabase, row.requested_company_id);
  const isBootstrapAdmin = memberCount === 0;

  if (!row.manager_approved_at && !isBootstrapAdmin) {
    return false; // still waiting on that company's manager
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: row.user_id,
    company_id: row.requested_company_id,
    full_name: row.full_name,
    email: row.email,
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

  await notifyRequesterApproved(row);

  return true;
}

export async function platformApprove(requestId: string, companyId: string) {
  const { supabase, user, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    throw new Error("Only TC Applicator Support can approve at this stage.");
  }

  const { data: updated, error } = await supabase
    .from("signup_requests")
    .update({
      requested_company_id: companyId,
      platform_approved_by: user.id,
      platform_approved_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to approve request: ${error.message}`);
  }

  const finalized = await finalizeIfReady(requestId);

  if (!finalized && updated) {
    await notifyCompanyManagers(supabase, updated as SignupRequestRow);
  }
}

export async function platformReject(requestId: string, reason: string) {
  const { supabase, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    throw new Error("Only TC Applicator Support can reject at this stage.");
  }

  const { data: updated, error } = await supabase
    .from("signup_requests")
    .update({ status: "rejected", rejection_reason: reason.trim() || null })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to reject request: ${error.message}`);
  }

  if (updated) {
    await notifyRequesterRejected(updated as SignupRequestRow, reason.trim());
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

  const { data: updated, error } = await supabase
    .from("signup_requests")
    .update({ status: "rejected", rejection_reason: reason.trim() || null })
    .eq("id", requestId)
    .eq("requested_company_id", companyId)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to reject request: ${error.message}`);
  }

  if (updated) {
    await notifyRequesterRejected(updated as SignupRequestRow, reason.trim());
  }
}