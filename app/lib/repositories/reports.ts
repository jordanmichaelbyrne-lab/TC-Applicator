import "server-only";

import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";

export type ReportEstimateRow = {
  id: string;
  approved_at: string;
  oem_part_number: string;
  manufacturer: string | null;
  edge_profile: string;
  customer_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  total_area_cm2: number;
  total_sell_price: number;
  // null when no Cost Analysis snapshot existed yet at approval time
  true_cost: number | null;
  carbide_weight_g: number | null;
  margin: number | null;
  quote_outcome: "pending" | "converted" | "lost";
};

export type ReportFilterOptions = {
  users: { id: string; name: string }[];
  manufacturers: string[];
  edgeProfiles: string[];
};

export type ReportData = {
  rows: ReportEstimateRow[];
  filterOptions: ReportFilterOptions;
};

/**
 * All filtering, date-range slicing, and grouping happens client-side
 * in ReportView — this returns every approved estimate (and the
 * matching true-cost snapshot data) once, so toggling a filter is
 * instant rather than a server round trip per change.
 */
async function buildReport(
  supabase: Awaited<ReturnType<typeof getCurrentUserAndCompany>>["supabase"],
  companyId: string
): Promise<ReportData> {
  const { data: estimates, error: estimatesError } = await supabase
    .from("estimates")
    .select(
      "id, approved_at, oem_part_number, manufacturer, edge_profile, customer_name, created_by, total_area_cm2, total_sell_price, quote_outcome"
    )
    .eq("company_id", companyId)
    .eq("status", "approved")
    .order("approved_at", { ascending: false });

  if (estimatesError) {
    throw new Error(`Unable to load estimates: ${estimatesError.message}`);
  }

  const { data: snapshots, error: snapshotsError } = await supabase
    .from("cost_analysis_snapshots")
    .select(
      "created_at, true_cost_per_cm2, deposit_rate_g_per_min, travel_speed_cm_per_min"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (snapshotsError) {
    throw new Error(`Unable to load cost analysis history: ${snapshotsError.message}`);
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", companyId);

  if (profilesError) {
    throw new Error(`Unable to load team names: ${profilesError.message}`);
  }

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p.full_name as string | null])
  );

  const sortedSnapshots = snapshots ?? [];

  function snapshotAsOf(dateIso: string) {
    // Most recent snapshot saved at or before this date — never a
    // later one, so a job's displayed cost can't be affected by
    // Cost Analysis changes made after it was approved.
    let match: (typeof sortedSnapshots)[number] | null = null;
    for (const snap of sortedSnapshots) {
      if (new Date(snap.created_at) <= new Date(dateIso)) {
        match = snap;
      } else {
        break;
      }
    }
    return match;
  }

  const manufacturerSet = new Set<string>();
  const edgeProfileSet = new Set<string>();
  const userIdSet = new Set<string>();

  const rows: ReportEstimateRow[] = (estimates ?? []).map((est) => {
    const snap = est.approved_at ? snapshotAsOf(est.approved_at) : null;

    let trueCost: number | null = null;
    let carbideWeightG: number | null = null;

    if (snap) {
      trueCost = est.total_area_cm2 * snap.true_cost_per_cm2;
      const gramsPerCm2 = snap.deposit_rate_g_per_min / snap.travel_speed_cm_per_min;
      carbideWeightG = est.total_area_cm2 * gramsPerCm2;
    }

    if (est.manufacturer) manufacturerSet.add(est.manufacturer);
    edgeProfileSet.add(est.edge_profile);
    if (est.created_by) userIdSet.add(est.created_by);

    return {
      id: est.id,
      approved_at: est.approved_at,
      oem_part_number: est.oem_part_number,
      manufacturer: est.manufacturer,
      edge_profile: est.edge_profile,
      customer_name: est.customer_name,
      created_by: est.created_by,
      created_by_name: est.created_by ? nameById.get(est.created_by) ?? null : null,
      total_area_cm2: est.total_area_cm2,
      total_sell_price: est.total_sell_price ?? 0,
      true_cost: trueCost,
      carbide_weight_g: carbideWeightG,
      margin: trueCost !== null ? (est.total_sell_price ?? 0) - trueCost : null,
      quote_outcome: est.quote_outcome,
    };
  });

  return {
    rows,
    filterOptions: {
      users: Array.from(userIdSet).map((id) => ({
        id,
        name: nameById.get(id) || "Unknown",
      })),
      manufacturers: Array.from(manufacturerSet).sort(),
      edgeProfiles: Array.from(edgeProfileSet).sort(),
    },
  };
}

/** Director's own company — used by /reports. */
export async function getOwnCompanyReport(): Promise<ReportData> {
  const { supabase, companyId, isDirector, isPlatformAdmin } =
    await getCurrentUserAndCompany();

  if (!isDirector && !isPlatformAdmin) {
    throw new Error("Only a company director can view reports.");
  }

  return buildReport(supabase, companyId);
}

/**
 * TC Support viewing one specific company's report — used from the
 * existing Admin > All Companies > [company] read-only oversight
 * flow. Deliberately takes an explicit companyId rather than reading
 * it from the caller's own profile, since a platform admin's own
 * company_id is unrelated to the company being reviewed. Never
 * aggregates or compares across companies.
 */
export async function getCompanyReportForPlatformAdmin(
  companyId: string
): Promise<ReportData> {
  const { supabase, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    throw new Error("Only TC Applicator Support can view this.");
  }

  return buildReport(supabase, companyId);
}