import "server-only";

import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import {
  mapOemPartPatternRow,
  type CreateOemPartPatternInput,
  type OemPartPatternRow,
} from "@/app/types/oem-part-patterns";

export type OemPartPattern = ReturnType<typeof mapOemPartPatternRow>;

export async function listPatternsForPart(oemPartId: string) {
  const { supabase, companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("oem_part_patterns")
    .select("*")
    .eq("oem_part_id", oemPartId)
    .eq("company_id", companyId)
    .order("pattern_number");

  if (error) {
    throw new Error(`Unable to load coating patterns: ${error.message}`);
  }

  return ((data ?? []) as OemPartPatternRow[]).map(mapOemPartPatternRow);
}

export async function createPattern(
  input: CreateOemPartPatternInput
): Promise<OemPartPattern> {
  const { supabase, user, companyId } = await getCurrentUserAndCompany();

  const { data: latest, error: latestError } = await supabase
    .from("oem_part_patterns")
    .select("pattern_number")
    .eq("oem_part_id", input.oemPartId)
    .eq("company_id", companyId)
    .order("pattern_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    throw new Error(
      `Unable to determine next pattern number: ${latestError.message}`
    );
  }

  const nextPatternNumber = (latest?.pattern_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("oem_part_patterns")
    .insert({
      oem_part_id: input.oemPartId,
      company_id: companyId,
      pattern_number: nextPatternNumber,
      bevel_runs_per_side: input.bevelRunsPerSide,
      leading_edge_runs_per_side: input.leadingEdgeRunsPerSide,
      bottom_face_runs_per_side: input.bottomFaceRunsPerSide,
      eyebrow_type: input.eyebrowType,
      short_eyebrows_per_hole: input.shortEyebrowsPerHole,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    // Two approvals landing at the same instant could race on the same
    // pattern_number — retry once with a freshly computed number.
    if (error.code === "23505") {
      return createPattern(input);
    }
    throw new Error(`Unable to save coating pattern: ${error.message}`);
  }

  return mapOemPartPatternRow(data as OemPartPatternRow);
}