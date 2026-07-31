"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { managerApprove, managerReject } from "@/app/lib/repositories/signupRequests";

export async function managerApproveAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");

  if (!requestId) {
    redirect("/team-requests?error=Missing%20request%20ID.");
  }

  try {
    await managerApprove(requestId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to approve request.";
    redirect(`/team-requests?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/team-requests");
  redirect("/team-requests?success=Team%20member%20approved.");
}

export async function managerRejectAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!requestId) {
    redirect("/team-requests?error=Missing%20request%20ID.");
  }

  try {
    await managerReject(requestId, reason);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reject request.";
    redirect(`/team-requests?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/team-requests");
  redirect("/team-requests?success=Request%20rejected.");
}