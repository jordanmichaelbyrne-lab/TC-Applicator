import { createClient } from "@/app/lib/supabase/server";

export type CompanySettings = {
  carbide_cost_rate_per_cm2: number;
  run_width_mm: number;
  eyebrow_length_mm: number;
  hole_row_spacing_mm: number;
  hole_offset_mm: number;
};

const DEFAULT_SETTINGS: CompanySettings = {
  carbide_cost_rate_per_cm2: 0.45,
  run_width_mm: 25,
  eyebrow_length_mm: 100,
  hole_row_spacing_mm: 50,
  hole_offset_mm: 75,
};

export async function getCompanySettings(): Promise<CompanySettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("company_settings")
    .select(
      "carbide_cost_rate_per_cm2, run_width_mm, eyebrow_length_mm, hole_row_spacing_mm, hole_offset_mm"
    )
    .single();

  if (error || !data) {
    return DEFAULT_SETTINGS;
  }

  return {
    carbide_cost_rate_per_cm2: Number(data.carbide_cost_rate_per_cm2),
    run_width_mm: Number(data.run_width_mm),
    eyebrow_length_mm: Number(data.eyebrow_length_mm),
    hole_row_spacing_mm: Number(data.hole_row_spacing_mm),
    hole_offset_mm: Number(data.hole_offset_mm),
  };
}