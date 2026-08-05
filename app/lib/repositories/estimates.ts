import "server-only";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";

export type EstimateStatus = "draft" | "pending_approval" | "approved" | "rejected";
export type EdgeProfile = "single-bevel" | "double-bevel" | "square-edge";
export type EyebrowType = "none" | "short" | "full";

export type EstimateRow = {
  id: string;
  company_id: string;
  oem_part_id: string | null;
  oem_part_pattern_id: string | null;
  oem_part_number: string;
  manufacturer: string | null;
  machine_type: string | null;
  machine_model: string | null;
  edge_type: string | null;
  edge_profile: EdgeProfile;
  customer_name: string | null;
  job_reference: string | null;
  length_mm: number;
  width_mm: number;
  thickness_mm: number;
  hole_count: number;
  hole_diameter_mm: number | null;
  hole_rows: number;
  hole_offset: boolean;
  bevel_runs_per_side: number;
  leading_edge_runs_per_side: number;
  bottom_face_runs_per_side: number;
  eyebrow_type: EyebrowType;
  short_eyebrows_per_hole: number;
  total_area_cm2: number | null;
  carbide_cost_rate_per_cm2: number | null;
  total_carbide_cost: number | null;
  sell_rate_per_cm2: number | null;
  total_sell_price: number | null;
  status: EstimateStatus;
  photo_url: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Snapshot of the coating-defaults settings active at save time —
  // null on rows created before this snapshot existed, in which case
  // callers fall back to the company's current settings.
  run_width_mm: number | null;
  eyebrow_length_mm: number | null;
  hole_row_spacing_mm: number | null;
  hole_offset_mm: number | null;
};

export type CreateEstimateInput = {
  oemPartId?: string | null;
  oemPartPatternId?: string | null;
  oemPartNumber: string;
  manufacturer?: string;
  machineType?: string;
  machineModel?: string;
  edgeType?: string;
  edgeProfile: EdgeProfile;
  customerName?: string;
  jobReference?: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  holeCount: number;
  holeDiameterMm?: number;
  holeRows?: 1 | 2 | 3;
  holeOffset?: boolean;
  bevelRunsPerSide: number;
  leadingEdgeRunsPerSide: number;
  bottomFaceRunsPerSide: number;
  eyebrowType: EyebrowType;
  shortEyebrowsPerHole: number;
  totalAreaCm2: number;
  carbideCostRatePerCm2: number;
  totalCarbideCost: number;
  sellRatePerCm2: number;
  totalSellPrice: number;
  notes?: string;
  // The coating-defaults settings actually in effect when this
  // estimate was calculated — snapshotted onto the row so later
  // changes to company settings never alter how this estimate's
  // drawing displays after the fact.
  runWidthMm: number;
  eyebrowLengthMm: number;
  holeRowSpacingMm: number;
  holeOffsetMm: number;
};

function mapInputToRow(input: CreateEstimateInput, companyId: string, userId: string, status: EstimateStatus) {
  return {
    company_id: companyId,
    oem_part_id: input.oemPartId ?? null,
    oem_part_pattern_id: input.oemPartPatternId ?? null,
    oem_part_number: input.oemPartNumber.trim(),
    manufacturer: input.manufacturer?.trim() || null,
    machine_type: input.machineType?.trim() || null,
    machine_model: input.machineModel?.trim() || null,
    edge_type: input.edgeType?.trim() || null,
    edge_profile: input.edgeProfile,
    customer_name: input.customerName?.trim() || null,
    job_reference: input.jobReference?.trim() || null,
    length_mm: input.lengthMm,
    width_mm: input.widthMm,
    thickness_mm: input.thicknessMm,
    hole_count: input.holeCount,
    hole_diameter_mm: input.holeDiameterMm ?? null,
    hole_rows: input.holeRows && input.holeRows >= 1 && input.holeRows <= 3 ? input.holeRows : 1,
    hole_offset: input.holeOffset ?? false,
    bevel_runs_per_side: input.bevelRunsPerSide,
    leading_edge_runs_per_side: input.leadingEdgeRunsPerSide,
    bottom_face_runs_per_side: input.bottomFaceRunsPerSide,
    eyebrow_type: input.eyebrowType,
    short_eyebrows_per_hole: input.shortEyebrowsPerHole,
    total_area_cm2: input.totalAreaCm2,
    carbide_cost_rate_per_cm2: input.carbideCostRatePerCm2,
    total_carbide_cost: input.totalCarbideCost,
    sell_rate_per_cm2: input.sellRatePerCm2,
    total_sell_price: input.totalSellPrice,
    notes: input.notes?.trim() || null,
    status,
    created_by: userId,
    updated_by: userId,
    run_width_mm: input.runWidthMm,
    eyebrow_length_mm: input.eyebrowLengthMm,
    hole_row_spacing_mm: input.holeRowSpacingMm,
    hole_offset_mm: input.holeOffsetMm,
  };
}

export async function saveEstimateDraft(input: CreateEstimateInput, existingId?: string) {
  const { supabase, user, companyId } = await getCurrentUserAndCompany();
  const row = mapInputToRow(input, companyId, user.id, "draft");

  if (existingId) {
    const { data, error } = await supabase
      .from("estimates")
      .update({ ...row, updated_by: user.id })
      .eq("id", existingId)
      .select("*")
      .single();

    if (error) throw new Error(`Unable to update draft: ${error.message}`);
    return data as EstimateRow;
  }

  const { data, error } = await supabase
    .from("estimates")
    .insert(row)
    .select("*")
    .single();

  if (error) throw new Error(`Unable to save draft: ${error.message}`);
  return data as EstimateRow;
}

export async function submitEstimateForApproval(input: CreateEstimateInput, existingId?: string) {
  const { supabase, user, companyId } = await getCurrentUserAndCompany();
  const row = mapInputToRow(input, companyId, user.id, "pending_approval");

  if (existingId) {
    const { data, error } = await supabase
      .from("estimates")
      .update({ ...row, updated_by: user.id })
      .eq("id", existingId)
      .select("*")
      .single();

    if (error) throw new Error(`Unable to submit for approval: ${error.message}`);
    return data as EstimateRow;
  }

  const { data, error } = await supabase
    .from("estimates")
    .insert(row)
    .select("*")
    .single();

  if (error) throw new Error(`Unable to submit for approval: ${error.message}`);
  return data as EstimateRow;
}

export async function listCompanyEstimates() {
  const { supabase, companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load estimates: ${error.message}`);
  return (data ?? []) as EstimateRow[];
}

export async function listPendingApprovals() {
  const { supabase, companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Unable to load pending approvals: ${error.message}`);
  return (data ?? []) as EstimateRow[];
}

export async function listApprovedEstimates() {
  const { supabase, companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "approved")
    .order("approved_at", { ascending: false });

  if (error) throw new Error(`Unable to load approved drawings: ${error.message}`);
  return (data ?? []) as EstimateRow[];
}

export async function getEstimate(estimateId: string) {
  const { supabase, companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", estimateId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load estimate: ${error.message}`);
  return data as EstimateRow | null;
}

export async function approveEstimate(estimateId: string) {
  const { supabase, user, isAdmin } = await getCurrentUserAndCompany();

  if (!isAdmin) {
    throw new Error("Only an admin can approve an estimate.");
  }

  const { data, error } = await supabase
    .from("estimates")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", estimateId)
    .eq("status", "pending_approval")
    .select("*")
    .single();

  if (error) throw new Error(`Unable to approve estimate: ${error.message}`);
  return data as EstimateRow;
}

export async function rejectEstimate(estimateId: string, reason: string) {
  const { supabase, user, isAdmin } = await getCurrentUserAndCompany();

  if (!isAdmin) {
    throw new Error("Only an admin can reject an estimate.");
  }

  const { data, error } = await supabase
    .from("estimates")
    .update({
      status: "rejected",
      rejection_reason: reason.trim() || null,
      updated_by: user.id,
    })
    .eq("id", estimateId)
    .eq("status", "pending_approval")
    .select("*")
    .single();

  if (error) throw new Error(`Unable to reject estimate: ${error.message}`);
  return data as EstimateRow;
}

export async function linkEstimateToOemPartAndPattern(
  estimateId: string,
  oemPartId: string,
  oemPartPatternId: string
) {
  const { supabase, user } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("estimates")
    .update({
      oem_part_id: oemPartId,
      oem_part_pattern_id: oemPartPatternId,
      updated_by: user.id,
    })
    .eq("id", estimateId)
    .select("*")
    .single();

  if (error) throw new Error(`Unable to link estimate: ${error.message}`);
  return data as EstimateRow;
}

export async function getSignedPhotoUrl(photoPath: string, expiresInSeconds = 3600) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("estimate-photos")
    .createSignedUrl(photoPath, expiresInSeconds);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}

export async function uploadEstimatePhoto(estimateId: string, file: File) {
  const { supabase, companyId } = await getCurrentUserAndCompany();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${companyId}/${estimateId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("estimate-photos")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Unable to upload photo: ${uploadError.message}`);
  }

  return attachEstimatePhoto(estimateId, path);
}

export async function attachEstimatePhoto(estimateId: string, photoPath: string) {
  const { supabase, user } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("estimates")
    .update({ photo_url: photoPath, updated_by: user.id })
    .eq("id", estimateId)
    .select("*")
    .single();

  if (error) throw new Error(`Unable to attach photo: ${error.message}`);
  return data as EstimateRow;
}