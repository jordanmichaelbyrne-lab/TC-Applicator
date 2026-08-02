"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  saveEstimateDraft,
  submitEstimateForApproval,
  uploadEstimatePhoto,
  approveEstimate,
  rejectEstimate,
  type CreateEstimateInput,
} from "@/app/lib/repositories/estimates";
import { getOemParts, type OemPart } from "@/app/lib/repositories/oemParts";
import { getCompanySettings, type CompanySettings } from "@/app/lib/settings/companySettings";

type ActionResult<T> =
  | { success: true; estimate: T }
  | { success: false; message: string };

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function saveDraftAction(
  input: CreateEstimateInput,
  existingId?: string
): Promise<ActionResult<Awaited<ReturnType<typeof saveEstimateDraft>>>> {
  try {
    const estimate = await saveEstimateDraft(input, existingId);
    return { success: true, estimate };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to save draft."),
    };
  }
}

export async function submitForApprovalAction(
  input: CreateEstimateInput,
  existingId?: string
): Promise<ActionResult<Awaited<ReturnType<typeof submitEstimateForApproval>>>> {
  try {
    const estimate = await submitEstimateForApproval(input, existingId);
    return { success: true, estimate };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to submit for approval."),
    };
  }
}

export async function uploadEstimatePhotoAction(
  estimateId: string,
  formData: FormData
): Promise<ActionResult<Awaited<ReturnType<typeof uploadEstimatePhoto>>>> {
  try {
    const file = formData.get("photo");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "No photo selected." };
    }

    const estimate = await uploadEstimatePhoto(estimateId, file);
    return { success: true, estimate };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to upload photo."),
    };
  }
}

// ---- OEM part catalog, for the New Estimate page's search ----

type PartsActionResult =
  | { success: true; parts: OemPart[] }
  | { success: false; message: string };

export async function getOemPartsAction(): Promise<PartsActionResult> {
  try {
    const parts = await getOemParts();
    return { success: true, parts };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to load OEM parts."),
    };
  }
}

// ---- Company settings (carbide rate, run width, eyebrow length), for
// the New Estimate page's live calculator defaults ----

type SettingsActionResult =
  | { success: true; settings: CompanySettings }
  | { success: false; message: string };

export async function getCompanySettingsAction(): Promise<SettingsActionResult> {
  try {
    const settings = await getCompanySettings();
    return { success: true, settings };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to load company settings."),
    };
  }
}

// ---- Form-based actions for the /approvals page ----

export async function approveEstimateAction(formData: FormData) {
  const estimateId = String(formData.get("estimateId") ?? "");

  if (!estimateId) {
    redirect("/approvals?error=Missing%20estimate%20ID.");
  }

  try {
    await approveEstimate(estimateId);
  } catch (error) {
    const message = toErrorMessage(error, "Unable to approve estimate.");
    redirect(`/approvals?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/approvals");
  redirect("/approvals?success=Estimate%20approved.");
}

export async function rejectEstimateAction(formData: FormData) {
  const estimateId = String(formData.get("estimateId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!estimateId) {
    redirect("/approvals?error=Missing%20estimate%20ID.");
  }

  try {
    await rejectEstimate(estimateId, reason);
  } catch (error) {
    const message = toErrorMessage(error, "Unable to reject estimate.");
    redirect(`/approvals?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/approvals");
  redirect("/approvals?success=Estimate%20rejected.");
}