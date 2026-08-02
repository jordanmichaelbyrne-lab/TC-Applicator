export type EyebrowType = "none" | "short" | "full";

export type OemPartPatternRow = {
  id: string;
  oem_part_id: string;
  company_id: string;
  pattern_number: number;
  bevel_runs_per_side: number;
  leading_edge_runs_per_side: number;
  bottom_face_runs_per_side: number;
  eyebrow_type: EyebrowType;
  short_eyebrows_per_hole: number;
  created_by: string | null;
  created_at: string;
};

export type CreateOemPartPatternInput = {
  oemPartId: string;
  bevelRunsPerSide: number;
  leadingEdgeRunsPerSide: number;
  bottomFaceRunsPerSide: number;
  eyebrowType: EyebrowType;
  shortEyebrowsPerHole: number;
};

export function mapOemPartPatternRow(row: OemPartPatternRow) {
  return {
    id: row.id,
    oemPartId: row.oem_part_id,
    patternNumber: row.pattern_number,
    patternLabel: `Pattern ${row.pattern_number}`,
    bevelRunsPerSide: Number(row.bevel_runs_per_side),
    leadingEdgeRunsPerSide: Number(row.leading_edge_runs_per_side),
    bottomFaceRunsPerSide: Number(row.bottom_face_runs_per_side),
    eyebrowType: row.eyebrow_type,
    shortEyebrowsPerHole: Number(row.short_eyebrows_per_hole),
    createdAt: row.created_at,
  };
}