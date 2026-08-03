"use server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { revalidatePath } from "next/cache";

export type UpdateSettingsResult =
  | { success: true }
  | { success: false; error: string };

export async function updateCompanySettings(formData: {
  carbideCostRatePerCm2: number;
  runWidthMm: number;
  eyebrowLengthMm: number;
  holeRowSpacingMm: number;
}): Promise<UpdateSettingsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  if (formData.carbideCostRatePerCm2 <= 0) {
    return { success: false, error: "Carbide cost rate must be greater than 0." };
  }
  if (formData.runWidthMm <= 0) {
    return { success: false, error: "Run width must be greater than 0." };
  }
  if (formData.eyebrowLengthMm <= 0) {
    return { success: false, error: "Eyebrow length must be greater than 0." };
  }
  if (formData.holeRowSpacingMm <= 0) {
    return { success: false, error: "Hole row spacing must be greater than 0." };
  }

  const { companyId } = await getCurrentUserAndCompany();

  const { error } = await supabase
    .from("company_settings")
    .update({
      carbide_cost_rate_per_cm2: formData.carbideCostRatePerCm2,
      run_width_mm: formData.runWidthMm,
      eyebrow_length_mm: formData.eyebrowLengthMm,
      hole_row_spacing_mm: formData.holeRowSpacingMm,
      updated_by: user.id,
    })
    .eq("company_id", companyId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/coating-defaults");
  revalidatePath("/estimates/new");

  return { success: true };
}