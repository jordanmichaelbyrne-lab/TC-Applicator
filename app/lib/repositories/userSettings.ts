import "server-only";

import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import {
  getPlatformAdminEmails,
} from "@/app/lib/repositories/signupRequests";
import { sendEmail, emailTemplate, APP_URL } from "@/app/lib/email/brevo";

// ---------- Profile (any signed-in user, their own row) ----------

export async function updateOwnProfile(input: { fullName: string }) {
  const { supabase, user } = await getCurrentUserAndCompany();

  const fullName = input.fullName.trim();

  if (!fullName) {
    throw new Error("Name can't be empty.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Unable to update your profile: ${error.message}`);
  }
}

export async function updateOwnPassword(newPassword: string) {
  const { supabase } = await getCurrentUserAndCompany();

  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw new Error(`Unable to update your password: ${error.message}`);
  }
}

export async function updateOwnNotificationPreference(notifyByEmail: boolean) {
  const { supabase, user } = await getCurrentUserAndCompany();

  const { error } = await supabase
    .from("profiles")
    .update({ notify_by_email: notifyByEmail })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Unable to update your notification preference: ${error.message}`);
  }
}

export async function getOwnNotificationPreference() {
  const { supabase, user } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("profiles")
    .select("notify_by_email")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load your notification preference: ${error.message}`);
  }

  return Boolean(data?.notify_by_email ?? true);
}

// ---------- Support request (any signed-in user) ----------

export async function submitSupportRequest(input: {
  subject: string;
  message: string;
}) {
  const { supabase, user, fullName, companyName } = await getCurrentUserAndCompany();

  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!subject || !message) {
    throw new Error("Please fill in both a subject and a message.");
  }

  const recipients = await getPlatformAdminEmails(supabase);

  if (recipients.length === 0) {
    throw new Error(
      "No TC Applicator Support contact is available right now — please try again later."
    );
  }

  await sendEmail({
    to: recipients,
    subject: `Support request — ${subject}`,
    html: emailTemplate({
      title: "New support request",
      bodyHtml: `
        <p><strong>${fullName || "Unknown"}</strong> at <strong>${companyName || "Unknown company"}</strong> (${user.email}) submitted a support request.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
      ctaText: "Open TC Applicator Support",
      ctaUrl: `${APP_URL}/admin/signups`,
    }),
  });
}

// ---------- Team management (company admin only) ----------

export type CompanyTeamMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_admin: boolean;
};

export async function listOwnCompanyMembers() {
  const { supabase, companyId, isAdmin } = await getCurrentUserAndCompany();

  if (!isAdmin) {
    throw new Error("Only a company admin can view this.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin")
    .eq("company_id", companyId)
    .order("full_name");

  if (error) {
    throw new Error(`Unable to load your team: ${error.message}`);
  }

  return (data ?? []) as CompanyTeamMember[];
}

async function countCompanyAdmins(
  supabase: Awaited<ReturnType<typeof getCurrentUserAndCompany>>["supabase"],
  companyId: string
) {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("is_admin", true);

  if (error) {
    throw new Error(`Unable to check admin count: ${error.message}`);
  }

  return count ?? 0;
}

export async function setTeamMemberAdmin(memberId: string, makeAdmin: boolean) {
  const { supabase, companyId, isAdmin } = await getCurrentUserAndCompany();

  if (!isAdmin) {
    throw new Error("Only a company admin can do this.");
  }

  if (!makeAdmin) {
    const adminCount = await countCompanyAdmins(supabase, companyId);
    if (adminCount <= 1) {
      throw new Error(
        "You can't remove the last remaining admin — promote someone else first."
      );
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: makeAdmin })
    .eq("id", memberId)
    .eq("company_id", companyId);

  if (error) {
    throw new Error(`Unable to update that team member: ${error.message}`);
  }
}

export async function removeTeamMember(memberId: string) {
  const { supabase, user, companyId, isAdmin } = await getCurrentUserAndCompany();

  if (!isAdmin) {
    throw new Error("Only a company admin can do this.");
  }

  if (memberId === user.id) {
    throw new Error("You can't remove yourself — ask another admin to do that.");
  }

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", memberId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (targetError) {
    throw new Error(`Unable to look up that team member: ${targetError.message}`);
  }

  if (target?.is_admin) {
    const adminCount = await countCompanyAdmins(supabase, companyId);
    if (adminCount <= 1) {
      throw new Error(
        "You can't remove the last remaining admin — promote someone else first."
      );
    }
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", memberId)
    .eq("company_id", companyId);

  if (error) {
    throw new Error(`Unable to remove that team member: ${error.message}`);
  }
}