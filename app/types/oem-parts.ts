export type EngineeringStatus =
  | "Draft"
  | "Pending Verification"
  | "Verified";

export type StandardCoatingPattern = {
  bevelRunsPerSide: number;
  leadingEdgeRunsPerSide: number;
  bottomFaceRunsPerSide: number;
  eyebrowsPerHole: number;
};

export type OemPartRow = {
  id: string;
  oem_part_number: string;
  manufacturer: string;
  description: string;
  part_category: string;
  profile_family: string;
  length_mm: number;
  width_mm: number;
  thickness_mm: number;
  hole_count: number;
  hole_diameter_mm: number;
  hole_rows: number;
  hole_offset: boolean;
  compatible_machines: string[];
  standard_pattern: StandardCoatingPattern;
  engineering_status: EngineeringStatus;
  condition_requirement: string;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateOemPartInput = {
  oemPartNumber: string;
  manufacturer: string;
  description: string;
  partCategory: string;
  profileFamily: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  holeCount: number;
  holeDiameterMm: number;
  holeRows?: 1 | 2 | 3;
  holeOffset?: boolean;
  compatibleMachines: string[];
  standardPattern: StandardCoatingPattern;
  engineeringStatus: EngineeringStatus;
  conditionRequirement: "New OEM Specification Only";
  notes?: string;
};

export function mapOemPartRow(row: OemPartRow) {
  return {
    id: row.id,
    oemPartNumber: row.oem_part_number,
    manufacturer: row.manufacturer,
    description: row.description,
    partCategory: row.part_category,
    profileFamily: row.profile_family,
    lengthMm: Number(row.length_mm),
    widthMm: Number(row.width_mm),
    thicknessMm: Number(row.thickness_mm),
    holeCount: row.hole_count,
    holeDiameterMm: Number(row.hole_diameter_mm),
    holeRows: (row.hole_rows >= 1 && row.hole_rows <= 3 ? row.hole_rows : 1) as 1 | 2 | 3,
    holeOffset: Boolean(row.hole_offset),
    compatibleMachines: row.compatible_machines ?? [],
    standardPattern: row.standard_pattern,
    engineeringStatus: row.engineering_status,
    conditionRequirement: row.condition_requirement,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCreateOemPartInput(
  input: CreateOemPartInput,
  userId: string
) {
  return {
    oem_part_number: input.oemPartNumber.trim(),
    manufacturer: input.manufacturer.trim(),
    description: input.description.trim(),
    part_category: input.partCategory,
    profile_family: input.profileFamily,
    length_mm: input.lengthMm,
    width_mm: input.widthMm,
    thickness_mm: input.thicknessMm,
    hole_count: input.holeCount,
    hole_diameter_mm: input.holeDiameterMm,
    hole_rows: input.holeRows && input.holeRows >= 1 && input.holeRows <= 3 ? input.holeRows : 1,
    hole_offset: input.holeOffset ?? false,
    compatible_machines: input.compatibleMachines,
    standard_pattern: input.standardPattern,
    engineering_status: input.engineeringStatus,
    condition_requirement: input.conditionRequirement,
    notes: input.notes?.trim() || null,
    created_by: userId,
    updated_by: userId,
  };
}