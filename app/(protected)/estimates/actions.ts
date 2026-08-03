"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  saveEstimateDraft,
  submitEstimateForApproval,
  uploadEstimatePhoto,
  approveEstimate,
  rejectEstimate,
  getEstimate,
  linkEstimateToOemPartAndPattern,
  type CreateEstimateInput,
} from "@/app/lib/repositories/estimates";
import {
  getOemParts,
  createOemPart,
  findOemPartByManufacturerAndNumber,
  type OemPart,
} from "@/app/lib/repositories/oemParts";
import {
  listPatternsForPart,
  createPattern,
} from "@/app/lib/repositories/oemPartPatterns";
import { getCompanySettings, type CompanySettings } from "@/app/lib/settings/companySettings";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { getSignedCompanyLogoUrl } from "@/app/lib/repositories/platformOverview";

type ActionResult<T> =
  | { success: true; estimate: T }
  | { success: false; message: string };

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type PrintMetaActionResult =
  | {
      success: true;
      meta: {
        fullName: string | null;
        companyName: string;
        companyLogoUrl: string | null;
      };
    }
  | { success: false; message: string };

export async function getPrintMetaAction(): Promise<PrintMetaActionResult> {
  try {
    const { fullName, companyName, companyLogoPath } = await getCurrentUserAndCompany();
    const companyLogoUrl = companyLogoPath
      ? await getSignedCompanyLogoUrl(companyLogoPath)
      : null;

    return {
      success: true,
      meta: { fullName, companyName, companyLogoUrl },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to load print details.",
    };
  }
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

// ---- Coating patterns for a matched OEM part ----

type PatternsActionResult =
  | { success: true; patterns: Awaited<ReturnType<typeof listPatternsForPart>> }
  | { success: false; message: string };

export async function getOemPartPatternsAction(
  oemPartId: string
): Promise<PatternsActionResult> {
  try {
    const patterns = await listPatternsForPart(oemPartId);
    return { success: true, patterns };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to load coating patterns."),
    };
  }
}

// ---- Company settings (carbide rate, run width, eyebrow length) ----

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

// ---- Load a single existing estimate, for the edit-before-approve flow ----

type GetEstimateActionResult =
  | { success: true; estimate: Awaited<ReturnType<typeof getEstimate>> }
  | { success: false; message: string };

export async function getEstimateAction(
  estimateId: string
): Promise<GetEstimateActionResult> {
  try {
    const estimate = await getEstimate(estimateId);
    return { success: true, estimate };
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Unable to load estimate."),
    };
  }
}

// ---- Form-based actions for the /approvals page ----

export async function approveEstimateAction(formData: FormData) {
  const estimateId = String(formData.get("estimateId") ?? "");

  if (!estimateId) {
    redirect("/approvals?error=Missing%20estimate%20ID.");
  }

  let approved: Awaited<ReturnType<typeof approveEstimate>> | undefined;

  try {
    approved = await approveEstimate(estimateId);
  } catch (error) {
    const message = toErrorMessage(error, "Unable to approve estimate.");
    redirect(`/approvals?error=${encodeURIComponent(message)}`);
  }

  if (approved && !approved.oem_part_pattern_id) {
    try {
      let oemPartId = approved.oem_part_id;

      if (!oemPartId) {
        const existingPart = await findOemPartByManufacturerAndNumber(
          approved.manufacturer || "",
          approved.oem_part_number
        );

        if (existingPart) {
          oemPartId = existingPart.id;
        } else {
          const newPart = await createOemPart({
            oemPartNumber: approved.oem_part_number,
            manufacturer: approved.manufacturer || "",
            description: approved.edge_type || approved.oem_part_number,
            partCategory: approved.edge_type || "",
            profileFamily: "Reverse Double Bevel",
            lengthMm: approved.length_mm,
            widthMm: approved.width_mm,
            thicknessMm: approved.thickness_mm,
            holeCount: approved.hole_count,
            holeDiameterMm: approved.hole_diameter_mm ?? 0,
            compatibleMachines: approved.machine_model
              ? approved.machine_model.split(",").map((m) => m.trim()).filter(Boolean)
              : [],
            standardPattern: {
              bevelRunsPerSide: approved.bevel_runs_per_side,
              leadingEdgeRunsPerSide: approved.leading_edge_runs_per_side,
              bottomFaceRunsPerSide: approved.bottom_face_runs_per_side,
              eyebrowsPerHole:
                approved.eyebrow_type === "short" ? approved.short_eyebrows_per_hole : 0,
            },
            engineeringStatus: "Pending Verification",
            conditionRequirement: "New OEM Specification Only",
            notes:
              "Auto-created from an approved estimate. Please review the category, profile family and machine list.",
          });
          oemPartId = newPart.id;
        }
      }

      if (!oemPartId) {
        throw new Error("Unable to resolve OEM part id.");
      }

      const newPattern = await createPattern({
        oemPartId,
        bevelRunsPerSide: approved.bevel_runs_per_side,
        leadingEdgeRunsPerSide: approved.leading_edge_runs_per_side,
        bottomFaceRunsPerSide: approved.bottom_face_runs_per_side,
        eyebrowType: approved.eyebrow_type,
        shortEyebrowsPerHole: approved.short_eyebrows_per_hole,
      });

      await linkEstimateToOemPartAndPattern(estimateId, oemPartId, newPattern.id);
    } catch (error) {
      const message = toErrorMessage(
        error,
        "Unknown error while auto-saving the OEM part."
      );
      console.error(
        "[approveEstimateAction] failed to auto-save OEM part/pattern:",
        error
      );
      revalidatePath("/approvals");
      revalidatePath("/oem-parts");
      redirect(
        `/approvals?success=Estimate%20approved.&warning=${encodeURIComponent(
          `Approved, but couldn't save it to the OEM Parts catalog: ${message}`
        )}`
      );
    }
  }

  revalidatePath("/approvals");
  revalidatePath("/oem-parts");
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