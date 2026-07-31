"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  updateOwnProfile,
  updateOwnPassword,
  updateOwnNotificationPreference,
  submitSupportRequest,
  setTeamMemberAdmin,
  removeTeamMember,
} from "@/app/lib/repositories/userSettings";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function updateProfileAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "");

  try {
    await updateOwnProfile({ fullName });
  } catch (error) {
    redirect(
      `/settings?error=${encodeURIComponent(errorMessage(error, "Unable to update your profile."))}`
    );
  }

  revalidatePath("/settings");
  redirect("/settings?success=Profile%20updated.");
}

export async function updatePasswordAction(formData: FormData) {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword !== confirmPassword) {
    redirect("/settings/password?error=Passwords%20don't%20match.");
  }

  try {
    await updateOwnPassword(newPassword);
  } catch (error) {
    redirect(
      `/settings/password?error=${encodeURIComponent(errorMessage(error, "Unable to update your password."))}`
    );
  }

  redirect("/settings/password?success=Password%20updated.");
}

export async function updateNotificationsAction(formData: FormData) {
  const notifyByEmail = formData.get("notifyByEmail") === "on";

  try {
    await updateOwnNotificationPreference(notifyByEmail);
  } catch (error) {
    redirect(
      `/settings/notifications?error=${encodeURIComponent(errorMessage(error, "Unable to update your preference."))}`
    );
  }

  revalidatePath("/settings/notifications");
  redirect("/settings/notifications?success=Preference%20saved.");
}

export async function submitSupportAction(formData: FormData) {
  const subject = String(formData.get("subject") ?? "");
  const message = String(formData.get("message") ?? "");

  try {
    await submitSupportRequest({ subject, message });
  } catch (error) {
    redirect(
      `/settings/support?error=${encodeURIComponent(errorMessage(error, "Unable to send your request."))}`
    );
  }

  redirect("/settings/support?success=Request%20sent%20to%20TC%20Applicator%20Support.");
}

export async function setTeamMemberAdminAction(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  const makeAdmin = formData.get("makeAdmin") === "true";

  if (!memberId) {
    redirect("/settings/team?error=Missing%20member%20ID.");
  }

  try {
    await setTeamMemberAdmin(memberId, makeAdmin);
  } catch (error) {
    redirect(
      `/settings/team?error=${encodeURIComponent(errorMessage(error, "Unable to update that team member."))}`
    );
  }

  revalidatePath("/settings/team");
  redirect("/settings/team?success=Team%20updated.");
}

export async function removeTeamMemberAction(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");

  if (!memberId) {
    redirect("/settings/team?error=Missing%20member%20ID.");
  }

  try {
    await removeTeamMember(memberId);
  } catch (error) {
    redirect(
      `/settings/team?error=${encodeURIComponent(errorMessage(error, "Unable to remove that team member."))}`
    );
  }

  revalidatePath("/settings/team");
  redirect("/settings/team?success=Team%20member%20removed.");
}