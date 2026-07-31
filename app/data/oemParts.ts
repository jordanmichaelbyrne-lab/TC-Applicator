export type ProfileFamily =
  | "Reverse Double Bevel"
  | "Dozer End Bit"
  | "Scraper Router Bit"
  | "Grader Blade";

export type PartCategory =
  | "Loader Centre Edge"
  | "Dozer Centre Edge"
  | "Dozer Outer Edge"
  | "Scraper Centre Edge"
  | "Excavator Edge"
  | "Dozer End Bit"
  | "Scraper Router Bit"
  | "Grader Blade";

export type CoatingPattern = {
  bevelRunsPerSide: number;
  leadingEdgeRunsPerSide: number;
  bottomFaceRunsPerSide: number;
  eyebrowsPerHole: number;
};

export type OemPart = {
  id: string;

  oemPartNumber: string;
  manufacturer: string;
  description: string;

  profileFamily: ProfileFamily;
  partCategory: PartCategory;

  lengthMm: number;
  widthMm: number;
  thicknessMm: number;

  holeCount: number;
  holeDiameterMm: number;

  compatibleMachines: string[];

  standardPattern: CoatingPattern;

  conditionRequirement: "New OEM Specification Only";

  engineeringStatus:
    | "Verified"
    | "Pending Verification"
    | "Draft";

  notes?: string;
};

export const oemParts: OemPart[] = [
  {
    id: "cat-1099212",

    oemPartNumber: "1099212",
    manufacturer: "Caterpillar",
    description: "Loader Centre Edge",

    profileFamily: "Reverse Double Bevel",
    partCategory: "Loader Centre Edge",

    // Temporary example dimensions.
    // Replace these with verified OEM dimensions.
    lengthMm: 1212,
    widthMm: 406,
    thicknessMm: 43.5,

    holeCount: 6,
    holeDiameterMm: 31,

    compatibleMachines: [
      "CAT 980",
    ],

    standardPattern: {
      bevelRunsPerSide: 2,
      leadingEdgeRunsPerSide: 1,
      bottomFaceRunsPerSide: 2,
      eyebrowsPerHole: 2,
    },

    conditionRequirement: "New OEM Specification Only",

    engineeringStatus: "Pending Verification",

    notes:
      "Coating must only be applied to a brand-new edge manufactured to the approved OEM specification.",
  },
];

function normaliseSearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function searchOemParts(searchTerm: string) {
  const normalisedSearch = normaliseSearchValue(searchTerm);

  if (!normalisedSearch) {
    return [];
  }

  return oemParts.filter((part) => {
    const searchableValues = [
      part.oemPartNumber,
      part.manufacturer,
      part.description,
      part.profileFamily,
      part.partCategory,
      part.lengthMm.toString(),
      part.widthMm.toString(),
      part.thicknessMm.toString(),
      part.holeCount.toString(),
      part.holeDiameterMm.toString(),
      ...part.compatibleMachines,
    ];

    return searchableValues.some((value) =>
      normaliseSearchValue(value).includes(normalisedSearch)
    );
  });
}

export function findOemPartByNumber(oemPartNumber: string) {
  const normalisedPartNumber = normaliseSearchValue(oemPartNumber);

  return oemParts.find(
    (part) =>
      normaliseSearchValue(part.oemPartNumber) === normalisedPartNumber
  );
}