import "server-only";

import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";

export type CostAnalysisSnapshot = {
  id: string;
  company_id: string;
  created_by: string;
  created_at: string;

  tungsten_price_per_kg: number;
  wire_cost_per_cm2: number;
  labour_rate_per_hour: number;
  deposit_rate_g_per_min: number;
  travel_speed_cm_per_min: number;

  rental_rate_per_m2: number;
  rental_area_m2: number;

  electricity_annual_cost: number;
  electricity_attribution_pct: number;
  electricity_hours_basis: number;

  working_days_per_year: number;
  hours_per_day: number;

  buffer_pct: number;

  true_cost_per_cm2: number;
  buffered_sales_cost_per_cm2: number;

  notes: string | null;
};

export type CostAnalysisInput = {
  tungstenPricePerKg: number;
  wireCostPerCm2: number;
  labourRatePerHour: number;
  depositRateGPerMin: number;
  travelSpeedCmPerMin: number;

  rentalRatePerM2: number;
  rentalAreaM2: number;

  electricityAnnualCost: number;
  electricityAttributionPct: number;
  electricityHoursBasis: number;

  workingDaysPerYear: number;
  hoursPerDay: number;

  bufferPct: number;

  notes?: string;
};

/**
 * Only directors and TC Support may see or record this — the
 * granular cost breakdown salespeople and regular admins should
 * never have visibility into. RLS enforces this too, as the real
 * layer of defense; this check is the app-level guard that gives a
 * clear error message instead of a silent empty result.
 */
async function assertCanViewCostAnalysis() {
  const ctx = await getCurrentUserAndCompany();

  if (!ctx.isDirector && !ctx.isPlatformAdmin) {
    throw new Error("Only a company director can view Cost Analysis.");
  }

  return ctx;
}

function computeCosts(input: CostAnalysisInput) {
  const tungstenGramsPerCm2 = input.depositRateGPerMin / input.travelSpeedCmPerMin;
  const tungstenCostPerCm2 =
    (input.tungstenPricePerKg / 1000) * tungstenGramsPerCm2;

  const labourCostPerCm2 =
    input.labourRatePerHour / 60 / input.travelSpeedCmPerMin;

  const baseCostPerCm2 =
    tungstenCostPerCm2 + input.wireCostPerCm2 + labourCostPerCm2;

  const annualRental = input.rentalRatePerM2 * input.rentalAreaM2;
  const rentalCostPerCm2 =
    annualRental /
    input.workingDaysPerYear /
    input.hoursPerDay /
    60 /
    input.travelSpeedCmPerMin;

  const attributedElectricity =
    input.electricityAnnualCost * (input.electricityAttributionPct / 100);
  const electricityCostPerCm2 =
    attributedElectricity /
    input.workingDaysPerYear /
    input.electricityHoursBasis /
    60 /
    input.travelSpeedCmPerMin;

  const trueCostPerCm2 =
    baseCostPerCm2 + rentalCostPerCm2 + electricityCostPerCm2;
  const bufferedSalesCostPerCm2 =
    trueCostPerCm2 * (1 + input.bufferPct / 100);

  return { trueCostPerCm2, bufferedSalesCostPerCm2 };
}

export async function saveCostAnalysisSnapshot(input: CostAnalysisInput) {
  const { supabase, user, companyId } = await assertCanViewCostAnalysis();

  const { trueCostPerCm2, bufferedSalesCostPerCm2 } = computeCosts(input);

  const { data, error } = await supabase
    .from("cost_analysis_snapshots")
    .insert({
      company_id: companyId,
      created_by: user.id,
      tungsten_price_per_kg: input.tungstenPricePerKg,
      wire_cost_per_cm2: input.wireCostPerCm2,
      labour_rate_per_hour: input.labourRatePerHour,
      deposit_rate_g_per_min: input.depositRateGPerMin,
      travel_speed_cm_per_min: input.travelSpeedCmPerMin,
      rental_rate_per_m2: input.rentalRatePerM2,
      rental_area_m2: input.rentalAreaM2,
      electricity_annual_cost: input.electricityAnnualCost,
      electricity_attribution_pct: input.electricityAttributionPct,
      electricity_hours_basis: input.electricityHoursBasis,
      working_days_per_year: input.workingDaysPerYear,
      hours_per_day: input.hoursPerDay,
      buffer_pct: input.bufferPct,
      true_cost_per_cm2: trueCostPerCm2,
      buffered_sales_cost_per_cm2: bufferedSalesCostPerCm2,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to save cost analysis snapshot: ${error.message}`);
  }

  return data as CostAnalysisSnapshot;
}

export async function listCostAnalysisSnapshots() {
  const { supabase, companyId } = await assertCanViewCostAnalysis();

  const { data, error } = await supabase
    .from("cost_analysis_snapshots")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    throw new Error(`Unable to load cost analysis history: ${error.message}`);
  }

  return (data ?? []) as CostAnalysisSnapshot[];
}