"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  platformApprove,
  platformReject,
  createCompany,
} from "@/app/lib/repositories/signupRequests";

export async function platformApproveAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const existingCompanyId = String(formData.get("existingCompanyId") ?? "");
  const newCompanyName = String(formData.get("newCompanyName") ?? "").trim();

  if (!requestId) {
    redirect("/admin/signups?error=Missing%20request%20ID.");
  }

  if (!existingCompanyId && !newCompanyName) {
    redirect("/admin/signups?error=Select%20or%20create%20a%20company.");
  }

  try {
    let companyId = existingCompanyId;

    if (!companyId) {
      const company = await createCompany(newCompanyName);
      companyId = company.id;
    }

    await platformApprove(requestId, companyId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to approve request.";
    redirect(`/admin/signups?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/signups");
  redirect("/admin/signups?success=Approved%20at%20platform%20level.");
}

export async function platformRejectAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!requestId) {
    redirect("/admin/signups?error=Missing%20request%20ID.");
  }

  try {
    await platformReject(requestId, reason);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reject request.";
    redirect(`/admin/signups?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/signups");
  redirect("/admin/signups?success=Request%20rejected.");
}