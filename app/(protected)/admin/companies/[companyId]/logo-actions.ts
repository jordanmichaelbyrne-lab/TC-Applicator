"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  setCompanyLogo,
  removeCompanyLogo,
} from "@/app/lib/repositories/platformOverview";

export async function setCompanyLogoAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const file = formData.get("logo");

  if (!companyId) {
    redirect("/admin/companies?error=Missing%20company%20ID.");
  }

  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/admin/companies/${companyId}?error=No%20logo%20file%20selected.`
    );
  }

  try {
    await setCompanyLogo(companyId, file);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to set logo.";
    redirect(
      `/admin/companies/${companyId}?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`/admin/companies/${companyId}?success=Logo%20updated.`);
}

export async function removeCompanyLogoAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");

  if (!companyId) {
    redirect("/admin/companies?error=Missing%20company%20ID.");
  }

  try {
    await removeCompanyLogo(companyId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to remove logo.";
    redirect(
      `/admin/companies/${companyId}?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`/admin/companies/${companyId}?success=Logo%20removed.`);
}