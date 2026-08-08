"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import CoatingLayout from "@/components/drawing/CoatingLayout";
import CoatingLayout3D from "@/components/drawing/CoatingLayout3D";
import CoatingLayoutEndBit from "@/components/drawing/CoatingLayoutEndBit";
import {
  saveDraftAction,
  submitForApprovalAction,
  uploadEstimatePhotoAction,
  getOemPartsAction,
  getOemPartPatternsAction,
  getEstimateAction,
  getCompanySettingsAction,
  getCarbideGramsPerCm2Action,
  getPrintMetaAction,
} from "@/app/(protected)/estimates/actions";
import type { CreateEstimateInput, EstimateStatus } from "@/app/lib/repositories/estimates";
import type { OemPart } from "@/app/lib/repositories/oemParts";

type EdgeProfile = "single-bevel" | "double-bevel" | "square-edge";
type PatternOption = {
  id: string;
  patternNumber: number;
  patternLabel: string;
  bevelRunsPerSide: number;
  leadingEdgeRunsPerSide: number;
  bottomFaceRunsPerSide: number;
  eyebrowType: "none" | "short" | "full";
  shortEyebrowsPerHole: number;
};

function normaliseSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function partMatchesSearch(part: OemPart, searchTerm: string) {
  const normalisedSearch = normaliseSearchValue(searchTerm);

  if (!normalisedSearch) {
    return false;
  }

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
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function formatWeight(grams: number) {
  return grams >= 1000
    ? `${(grams / 1000).toFixed(2)} kg`
    : `${grams.toFixed(0)} g`;
}

function formatPrintDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getMachineType(part: OemPart) {
  if (part.partCategory.startsWith("Loader")) return "Loader";
  if (part.partCategory.startsWith("Dozer")) return "Dozer";
  if (part.partCategory.startsWith("Scraper")) return "Scraper";
  if (part.partCategory.startsWith("Grader")) return "Grader";
  if (part.partCategory.startsWith("Excavator")) return "Excavator";

  return "";
}

export default function NewEstimatePage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const editEstimateId = searchParams.get("estimateId");

  const [partSearch, setPartSearch] = useState("");
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [highlightedResult, setHighlightedResult] = useState(0);
  const [allParts, setAllParts] = useState<OemPart[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const [partsLoadError, setPartsLoadError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [oemPartNumber, setOemPartNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [machineType, setMachineType] = useState("");
  const [machineModel, setMachineModel] = useState("");
  const [edgeType, setEdgeType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [jobReference, setJobReference] = useState("");

  const [lengthMm, setLengthMm] = useState(0);
  const [widthMm, setWidthMm] = useState(0);
  const [thicknessMm, setThicknessMm] = useState(0);
  const [holeCount, setHoleCount] = useState(0);
  const [holeDiameterMm, setHoleDiameterMm] = useState(26);
  const [holeRows, setHoleRows] = useState<1 | 2 | 3>(1);
  const [holeOffset, setHoleOffset] = useState(false);
  const [noHoles, setNoHoles] = useState(false);

  const [edgeProfile, setEdgeProfile] = useState<EdgeProfile>("double-bevel");
  const [topBevelRuns, setTopBevelRuns] = useState(0);
  const [leadingEdgeRuns, setLeadingEdgeRuns] = useState(0);
  const [bottomFaceRuns, setBottomFaceRuns] = useState(0);
  const [eyebrowType, setEyebrowType] = useState<"none" | "short" | "full">("none");
  const [shortEyebrowsPerHole, setShortEyebrowsPerHole] = useState(2);
  const [leftEndRuns, setLeftEndRuns] = useState(0);
  const [rightEndRuns, setRightEndRuns] = useState(0);

  // Dozer End Bit — a completely different part shape/hole
  // pattern/coating terminology to the normal straight-edge model, so
  // it's its own toggle rather than another edgeProfile option.
  const [isDozerEndBit, setIsDozerEndBit] = useState(false);
  const [endBitHand, setEndBitHand] = useState<"LH" | "RH">("RH");
  const [endBitFullLengthRuns, setEndBitFullLengthRuns] = useState(0);
  const [endBitShoulderRuns, setEndBitShoulderRuns] = useState(0);

  const [sellRatePerCm2, setSellRatePerCm2] = useState(0);

  const [oemPartId, setOemPartId] = useState<string | null>(null);
  const [oemPartPatternId, setOemPartPatternId] = useState<string | null>(null);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [estimateStatus, setEstimateStatus] = useState<EstimateStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  const [runWidthMm, setRunWidthMm] = useState(25);
  const [eyebrowLengthMm, setEyebrowLengthMm] = useState(100);
  const [carbideCostRatePerCm2, setCarbideCostRatePerCm2] = useState(0.45);
  const [holeRowSpacingMm, setHoleRowSpacingMm] = useState(50);
  const [holeOffsetMm, setHoleOffsetMm] = useState(75);
  const [carbideGramsPerCm2, setCarbideGramsPerCm2] = useState<number | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [printPreparedBy, setPrintPreparedBy] = useState<string | null>(null);
  const [printCompanyName, setPrintCompanyName] = useState("");
  const [printCompanyLogoUrl, setPrintCompanyLogoUrl] = useState<string | null>(null);
  const printDate = useMemo(() => formatPrintDate(new Date()), []);

  const [patternOptions, setPatternOptions] = useState<PatternOption[]>([]);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);
  const [patternsLoadError, setPatternsLoadError] = useState("");
  const [isCreatingNewPattern, setIsCreatingNewPattern] = useState(false);

  const [isLoadingExistingEstimate, setIsLoadingExistingEstimate] = useState(
    Boolean(editEstimateId)
  );
  const [loadExistingError, setLoadExistingError] = useState("");

  useEffect(() => {
    if (noHoles) {
      setHoleCount(0);
    }
  }, [noHoles]);

  useEffect(() => {
    if (!editEstimateId) {
      searchInputRef.current?.focus();
    }

    let cancelled = false;

    (async () => {
      const [partsResult, settingsResult, printMetaResult, carbideRatioResult] =
        await Promise.all([
          getOemPartsAction(),
          getCompanySettingsAction(),
          getPrintMetaAction(),
          getCarbideGramsPerCm2Action(),
        ]);

      if (cancelled) {
        return;
      }

      if (partsResult.success) {
        setAllParts(partsResult.parts);
      } else {
        setPartsLoadError(partsResult.message);
      }

      if (settingsResult.success) {
        setRunWidthMm(settingsResult.settings.run_width_mm);
        setEyebrowLengthMm(settingsResult.settings.eyebrow_length_mm);
        setCarbideCostRatePerCm2(settingsResult.settings.carbide_cost_rate_per_cm2);
        setHoleRowSpacingMm(settingsResult.settings.hole_row_spacing_mm);
        setHoleOffsetMm(settingsResult.settings.hole_offset_mm);
      }

      if (carbideRatioResult.success) {
        setCarbideGramsPerCm2(carbideRatioResult.gramsPerCm2);
      }

      if (printMetaResult.success) {
        setPrintPreparedBy(printMetaResult.meta.fullName);
        setPrintCompanyName(printMetaResult.meta.companyName);
        setPrintCompanyLogoUrl(printMetaResult.meta.companyLogoUrl);
      }

      setIsLoadingParts(false);
      setIsLoadingSettings(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [editEstimateId]);

  useEffect(() => {
    if (!editEstimateId) {
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await getEstimateAction(editEstimateId);

      if (cancelled) {
        return;
      }

      if (!result.success || !result.estimate) {
        setLoadExistingError(
          !result.success ? result.message : "That estimate could not be found."
        );
        setIsLoadingExistingEstimate(false);
        return;
      }

      const estimate = result.estimate;

      setOemPartId(estimate.oem_part_id);
      setOemPartPatternId(estimate.oem_part_pattern_id);
      setPartSearch(estimate.oem_part_number);
      setOemPartNumber(estimate.oem_part_number);
      setManufacturer(estimate.manufacturer ?? "");
      setMachineType(estimate.machine_type ?? "");
      setMachineModel(estimate.machine_model ?? "");
      setEdgeType(estimate.edge_type ?? "");
      setCustomerName(estimate.customer_name ?? "");
      setJobReference(estimate.job_reference ?? "");

      setLengthMm(estimate.length_mm);
      setWidthMm(estimate.width_mm);
      setThicknessMm(estimate.thickness_mm);
      setHoleCount(estimate.hole_count);
      setHoleDiameterMm(estimate.hole_diameter_mm ?? 26);
      const loadedRows = estimate.hole_rows;
      setHoleRows(loadedRows === 2 ? 2 : loadedRows === 3 ? 3 : 1);
      setHoleOffset(Boolean(estimate.hole_offset));
      setNoHoles(estimate.hole_count === 0);

      setEdgeProfile(estimate.edge_profile);
      setTopBevelRuns(estimate.bevel_runs_per_side);
      setLeadingEdgeRuns(estimate.leading_edge_runs_per_side);
      setBottomFaceRuns(estimate.bottom_face_runs_per_side);
      setEyebrowType(estimate.eyebrow_type);
      setShortEyebrowsPerHole(estimate.short_eyebrows_per_hole);
      setLeftEndRuns(estimate.left_end_runs ?? 0);
      setRightEndRuns(estimate.right_end_runs ?? 0);

      setSellRatePerCm2(estimate.sell_rate_per_cm2 ?? 0);

      setEstimateId(estimate.id);
      setEstimateStatus(estimate.status);
      setPhotoPath(estimate.photo_url);

      setIsLoadingExistingEstimate(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [editEstimateId]);

  const matchingParts = useMemo(() => {
    if (!partSearch.trim()) {
      return [];
    }

    return allParts
      .filter((part) => partMatchesSearch(part, partSearch))
      .slice(0, 8);
  }, [allParts, partSearch]);

  const selectedPart = useMemo(
    () =>
      allParts.find((part) => part.id === selectedPartId) ?? null,
    [allParts, selectedPartId]
  );

  useEffect(() => {
    setHighlightedResult(0);
  }, [partSearch]);

  useEffect(() => {
    if (!selectedPartId) {
      setPatternOptions([]);
      setIsCreatingNewPattern(false);
      return;
    }

    let cancelled = false;
    setIsLoadingPatterns(true);
    setPatternsLoadError("");

    (async () => {
      const result = await getOemPartPatternsAction(selectedPartId);

      if (cancelled) {
        return;
      }

      if (result.success) {
        setPatternOptions(result.patterns);

        if (result.patterns.length === 0) {
          startNewPattern();
        }
      } else {
        setPatternsLoadError(result.message);
        setPatternOptions([]);
        startNewPattern();
      }

      setIsLoadingPatterns(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartId]);

  const isNewPartMode =
    Boolean(partSearch.trim()) &&
    !selectedPartId &&
    matchingParts.length === 0;

  const partIsSelected = Boolean(selectedPart);
  const showForm = Boolean(editEstimateId) || partIsSelected || isNewPartMode;
  const isApproved = estimateStatus === "approved";

  useEffect(() => {
    if (isNewPartMode && !editEstimateId) {
      setOemPartNumber(partSearch.trim());
    }
  }, [isNewPartMode, partSearch, editEstimateId]);

  useEffect(() => {
    if (isNewPartMode) {
      startNewPattern();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewPartMode]);

  function loadPart(part: OemPart) {
    setSelectedPartId(part.id);
    setOemPartId(part.id);
    setOemPartPatternId(null);
    setPartSearch(part.oemPartNumber);

    setOemPartNumber(part.oemPartNumber);
    setManufacturer(part.manufacturer);
    setMachineType(getMachineType(part));
    setMachineModel(part.compatibleMachines.join(", "));
    setEdgeType(part.partCategory);

    setLengthMm(part.lengthMm);
    setWidthMm(part.widthMm);
    setThicknessMm(part.thicknessMm);
    setHoleCount(part.holeCount);
    setHoleDiameterMm(part.holeDiameterMm);
    setHoleRows(part.holeRows === 2 ? 2 : part.holeRows === 3 ? 3 : 1);
    setHoleOffset(Boolean(part.holeOffset));
    setNoHoles(part.holeCount === 0);

    setEdgeProfile("double-bevel");

    setTopBevelRuns(0);
    setLeadingEdgeRuns(0);
    setBottomFaceRuns(0);
    setEyebrowType("none");
    setShortEyebrowsPerHole(2);
    setLeftEndRuns(0);
    setRightEndRuns(0);
    setIsCreatingNewPattern(false);
    setIsDozerEndBit(part.partCategory === "Dozer End Bit");

    setSaveMessage("");
  }

  function loadPattern(pattern: PatternOption) {
    setOemPartPatternId(pattern.id);
    setIsCreatingNewPattern(false);

    setTopBevelRuns(pattern.bevelRunsPerSide);
    setLeadingEdgeRuns(pattern.leadingEdgeRunsPerSide);
    setBottomFaceRuns(pattern.bottomFaceRunsPerSide);
    setEyebrowType(pattern.eyebrowType);
    setShortEyebrowsPerHole(pattern.shortEyebrowsPerHole || 2);
    setLeftEndRuns(0);
    setRightEndRuns(0);
  }

  function startNewPattern() {
    setOemPartPatternId(null);
    setIsCreatingNewPattern(true);

    setTopBevelRuns(2);
    setLeadingEdgeRuns(1);
    setBottomFaceRuns(2);
    setEyebrowType("none");
    setShortEyebrowsPerHole(2);
    setLeftEndRuns(0);
    setRightEndRuns(0);
  }

  function clearPart() {
    setSelectedPartId(null);
    setOemPartId(null);
    setOemPartPatternId(null);
    setPartSearch("");

    setOemPartNumber("");
    setManufacturer("");
    setMachineType("");
    setMachineModel("");
    setEdgeType("");
    setCustomerName("");
    setJobReference("");

    setLengthMm(0);
    setWidthMm(0);
    setThicknessMm(0);
    setHoleCount(0);
    setHoleDiameterMm(26);
    setHoleRows(1);
    setHoleOffset(false);
    setNoHoles(false);

    setEdgeProfile("double-bevel");
    setTopBevelRuns(0);
    setLeadingEdgeRuns(0);
    setBottomFaceRuns(0);
    setEyebrowType("none");
    setShortEyebrowsPerHole(2);
    setLeftEndRuns(0);
    setRightEndRuns(0);

    setIsDozerEndBit(false);
    setEndBitHand("RH");
    setEndBitFullLengthRuns(0);
    setEndBitShoulderRuns(0);

    setPatternOptions([]);
    setIsCreatingNewPattern(false);
    setPatternsLoadError("");

    setSellRatePerCm2(0);
    setSaveMessage("");

    setEstimateId(null);
    setEstimateStatus(null);
    setActionError("");
    setPhotoFile(null);
    setPhotoPath(null);

    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (matchingParts.length === 0 || selectedPartId) {
      if (event.key === "Escape") {
        clearPart();
      }

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedResult((current) =>
        Math.min(current + 1, matchingParts.length - 1)
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedResult((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const part = matchingParts[highlightedResult];

      if (part) {
        loadPart(part);
      }
    }

    if (event.key === "Escape") {
      setPartSearch("");
    }
  }

  const calculations = useMemo(() => {
    const profileMultiplier = edgeProfile === "double-bevel" ? 2 : 1;
    const bevelRunQuantity =
      edgeProfile === "square-edge" ? 0 : topBevelRuns * profileMultiplier;
    const leadingEdgeRunQuantity = leadingEdgeRuns * profileMultiplier;
    const bottomFaceRunQuantity = bottomFaceRuns * (holeOffset ? 1 : 2);

    const fullEyebrowRunQuantity = eyebrowType === "full" ? 2 : 0;

    const totalFullLengthRuns =
      bevelRunQuantity +
      leadingEdgeRunQuantity +
      bottomFaceRunQuantity +
      fullEyebrowRunQuantity;

    const fullLengthAreaMm2 = lengthMm * runWidthMm * totalFullLengthRuns;

    const eyebrowHoleMultiplier = holeCount === 0 ? 0 : Math.max(holeRows, 1);
    const shortEyebrowQuantity =
      eyebrowType === "short"
        ? holeCount * eyebrowHoleMultiplier * shortEyebrowsPerHole
        : 0;

    const shortEyebrowAreaMm2 =
      shortEyebrowQuantity * eyebrowLengthMm * runWidthMm;

    const endRunQuantity = leftEndRuns + rightEndRuns;
    const endRunAreaMm2 = endRunQuantity * widthMm * runWidthMm;

    const totalAreaCm2 = isDozerEndBit
      ? 0
      : (fullLengthAreaMm2 + shortEyebrowAreaMm2 + endRunAreaMm2) / 100;

    const totalCarbideCost = totalAreaCm2 * carbideCostRatePerCm2;

    const totalSellPrice = totalAreaCm2 * sellRatePerCm2;
    const grossProfit = totalSellPrice - totalCarbideCost;
    const grossMargin =
      totalSellPrice > 0 ? (grossProfit / totalSellPrice) * 100 : 0;

    const carbideWeightG =
      carbideGramsPerCm2 !== null ? totalAreaCm2 * carbideGramsPerCm2 : null;

    return {
      bevelRunQuantity,
      leadingEdgeRunQuantity,
      bottomFaceRunQuantity,
      fullEyebrowRunQuantity,
      totalFullLengthRuns,
      shortEyebrowQuantity,
      endRunQuantity,
      totalAreaCm2,
      totalCarbideCost,
      totalSellPrice,
      grossProfit,
      grossMargin,
      carbideWeightG,
    };
  }, [
    lengthMm,
    widthMm,
    holeCount,
    holeRows,
    holeOffset,
    edgeProfile,
    topBevelRuns,
    leadingEdgeRuns,
    bottomFaceRuns,
    eyebrowType,
    shortEyebrowsPerHole,
    leftEndRuns,
    rightEndRuns,
    sellRatePerCm2,
    runWidthMm,
    eyebrowLengthMm,
    carbideCostRatePerCm2,
    carbideGramsPerCm2,
    isDozerEndBit,
  ]);

  function buildEstimateInput(): CreateEstimateInput {
    return {
      oemPartId,
      oemPartPatternId,
      oemPartNumber,
      manufacturer,
      machineType,
      machineModel,
      edgeType,
      customerName,
      jobReference,
      edgeProfile,
      lengthMm,
      widthMm,
      thicknessMm,
      holeCount,
      holeDiameterMm,
      holeRows,
      holeOffset,
      bevelRunsPerSide: topBevelRuns,
      leadingEdgeRunsPerSide: leadingEdgeRuns,
      bottomFaceRunsPerSide: bottomFaceRuns,
      eyebrowType,
      shortEyebrowsPerHole,
      leftEndRuns,
      rightEndRuns,
      carbideWeightG: calculations.carbideWeightG,
      totalAreaCm2: calculations.totalAreaCm2,
      carbideCostRatePerCm2,
      totalCarbideCost: calculations.totalCarbideCost,
      sellRatePerCm2,
      totalSellPrice: calculations.totalSellPrice,
      runWidthMm,
      eyebrowLengthMm,
      holeRowSpacingMm,
      holeOffsetMm,
    };
  }

  async function handleSaveDraft() {
    if (!oemPartNumber.trim()) {
      return;
    }

    setIsSaving(true);
    setActionError("");

    const result = await saveDraftAction(
      buildEstimateInput(),
      estimateId ?? undefined
    );

    setIsSaving(false);

    if (!result.success) {
      setActionError(result.message);
      return;
    }

    setEstimateId(result.estimate.id);
    setEstimateStatus(result.estimate.status);
    setSaveMessage("Draft saved.");
  }

  async function handleSubmitForApproval() {
    if (!oemPartNumber.trim()) {
      return;
    }

    setIsSubmitting(true);
    setActionError("");

    const result = await submitForApprovalAction(
      buildEstimateInput(),
      estimateId ?? undefined
    );

    setIsSubmitting(false);

    if (!result.success) {
      setActionError(result.message);
      return;
    }

    setEstimateId(result.estimate.id);
    setEstimateStatus(result.estimate.status);
    setSaveMessage(
      editEstimateId
        ? "Changes saved. Still pending admin approval."
        : "Submitted for admin approval."
    );
  }

  async function handleUploadPhoto() {
    if (!estimateId || !photoFile) {
      return;
    }

    setIsUploadingPhoto(true);
    setActionError("");

    const formData = new FormData();
    formData.set("photo", photoFile);

    const result = await uploadEstimatePhotoAction(estimateId, formData);

    setIsUploadingPhoto(false);

    if (!result.success) {
      setActionError(result.message);
      return;
    }

    setPhotoPath(result.estimate.photo_url);
    setPhotoFile(null);
    setSaveMessage("Photo attached.");
  }

  if (editEstimateId && isLoadingExistingEstimate) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="rounded-lg border border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Loading estimate…
        </div>
      </div>
    );
  }

  if (editEstimateId && loadExistingError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="rounded-lg border border-red-300 bg-red-50 p-8 text-center text-sm text-red-800">
          {loadExistingError}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="hidden print:flex print-title-page">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tc-applicator-logo.png" alt="TC Applicator" className="print-title-logo" />

          <div className="print-title-text">
            <h1>Coating Estimate</h1>
            <p>
              {oemPartNumber || "New part"}
              {manufacturer ? ` · ${manufacturer}` : ""}
            </p>
            {customerName && <p>Customer: {customerName}</p>}
            {jobReference && <p>Job reference: {jobReference}</p>}
          </div>

          {printCompanyLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={printCompanyLogoUrl}
              alt={printCompanyName || "Company logo"}
              className="print-title-logo"
            />
          )}
        </div>

        <div className="print-hidden mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {editEstimateId ? "Edit Estimate" : "New Estimate"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {editEstimateId
                ? "Review and fix this estimate before approving."
                : "Search a part, confirm the coating layout and enter the price."}
            </p>
          </div>

          {showForm && !editEstimateId && (
            <button
              type="button"
              onClick={clearPart}
              className="print-hidden w-fit rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              New Estimate
            </button>
          )}
        </div>

        {!editEstimateId && (
          <section className="print-hidden relative mb-5 rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                OEM part
              </span>

              <input
                ref={searchInputRef}
                value={partSearch}
                onChange={(event) => {
                  setPartSearch(event.target.value);
                  setSelectedPartId(null);
                  setSaveMessage("");
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-full rounded-md border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
                placeholder="Search OEM number, machine or description"
                autoComplete="off"
              />
            </label>

            {partSearch.trim() &&
              !selectedPartId &&
              matchingParts.length > 0 && (
                <div className="absolute left-5 right-5 top-[88px] z-20 overflow-hidden rounded-md border border-slate-300 bg-white shadow-xl">
                  {matchingParts.map((part, index) => (
                    <button
                      key={part.id}
                      type="button"
                      onMouseEnter={() =>
                        setHighlightedResult(index)
                      }
                      onClick={() => loadPart(part)}
                      className={`flex w-full items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 text-left last:border-b-0 ${
                        index === highlightedResult
                          ? "bg-slate-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="font-semibold">
                          {part.oemPartNumber}
                        </div>

                        <div className="mt-0.5 text-sm text-slate-700">
                          {part.manufacturer} · {part.description}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {part.compatibleMachines.join(", ")}
                        </div>
                      </div>

                      <div className="shrink-0 text-right text-xs text-slate-500">
                        {part.lengthMm} × {part.widthMm} ×{" "}
                        {part.thicknessMm} mm
                      </div>
                    </button>
                  ))}
                </div>
              )}

            {isNewPartMode && (
              <p className="mt-3 text-sm text-amber-700">
                No matching OEM part was found — enter the dimensions
                and coating pattern below to create one.
              </p>
            )}

            {isLoadingParts && (
              <p className="mt-3 text-sm text-slate-500">
                Loading OEM part catalog…
              </p>
            )}

            {partsLoadError && (
              <p className="mt-3 text-sm text-red-700">{partsLoadError}</p>
            )}
          </section>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px] print-layout-grid">
          <div className="space-y-5">
            <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold">Part details</h3>
              </div>

              {!showForm ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Search for an OEM part to begin.
                </div>
              ) : (
                <div className="p-5">
                  <div className="mb-5">
                    <div className="text-2xl font-semibold">
                      {oemPartNumber}
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      {partIsSelected
                        ? `${manufacturer} · ${edgeType}`
                        : "New OEM part — not yet in the database"}
                    </div>

                    {machineModel && (
                      <div className="mt-1 text-sm text-slate-500">
                        {machineType}: {machineModel}
                      </div>
                    )}
                  </div>

                  <div className="mb-4 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">
                        Customer name
                      </span>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="Who this job is for"
                        className="w-full rounded border border-slate-300 px-3 py-2"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">
                        Job reference (Pronto)
                      </span>
                      <input
                        type="text"
                        value={jobReference}
                        onChange={(event) => setJobReference(event.target.value)}
                        placeholder="Pronto job number"
                        className="w-full rounded border border-slate-300 px-3 py-2"
                      />
                    </label>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isDozerEndBit}
                        onChange={(event) => setIsDozerEndBit(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="text-sm font-medium">Dozer End Bit</span>
                    </label>

                    {isDozerEndBit && (
                      <label className="flex items-center gap-2">
                        <span className="text-sm font-medium">Hand</span>
                        <select
                          value={endBitHand}
                          onChange={(event) =>
                            setEndBitHand(event.target.value as "LH" | "RH")
                          }
                          className="rounded border border-slate-300 px-3 py-1.5"
                        >
                          <option value="RH">Right Hand (RH)</option>
                          <option value="LH">Left Hand (LH)</option>
                        </select>
                      </label>
                    )}
                  </div>

                  {!isDozerEndBit && (
                    <div className="mb-4 flex flex-wrap items-end gap-4">
                      <label className="block max-w-xs">
                        <span className="mb-1 block text-sm font-medium">
                          Edge profile
                        </span>

                        <select
                          value={edgeProfile}
                          onChange={(event) =>
                            setEdgeProfile(event.target.value as EdgeProfile)
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2"
                        >
                          <option value="single-bevel">Single Bevel</option>
                          <option value="double-bevel">
                            Double Bevel (reversible)
                          </option>
                          <option value="square-edge">Square Edge</option>
                        </select>
                      </label>

                      <label className="flex items-center gap-2 pb-2.5">
                        <input
                          type="checkbox"
                          checked={noHoles}
                          onChange={(event) => setNoHoles(event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span className="text-sm font-medium">No holes</span>
                      </label>

                      {!noHoles && (
                        <>
                          <label className="block max-w-xs">
                            <span className="mb-1 block text-sm font-medium">
                              Hole rows
                            </span>

                            <select
                              value={holeRows}
                              onChange={(event) =>
                                setHoleRows(Number(event.target.value) as 1 | 2 | 3)
                              }
                              className="w-full rounded border border-slate-300 px-3 py-2"
                            >
                              <option value={1}>Single row</option>
                              <option value={2}>2 row</option>
                              <option value={3}>3 row</option>
                            </select>

                            {holeRows > 1 && (
                              <span className="mt-1 block text-xs text-slate-500">
                                Standard row spacing: {holeRowSpacingMm} mm
                              </span>
                            )}
                          </label>

                          <label className="flex items-center gap-2 pb-2.5">
                            <input
                              type="checkbox"
                              checked={holeOffset}
                              onChange={(event) => setHoleOffset(event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm font-medium">
                              Offset toward top edge
                            </span>
                          </label>

                          {holeOffset && (
                            <span className="pb-2.5 text-xs text-slate-500">
                              Standard offset: {holeOffsetMm} mm
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <NumberField
                      label="Length"
                      value={lengthMm}
                      onChange={setLengthMm}
                      suffix="mm"
                    />

                    <NumberField
                      label="Width"
                      value={widthMm}
                      onChange={setWidthMm}
                      suffix="mm"
                    />

                    <NumberField
                      label="Thickness"
                      value={thicknessMm}
                      onChange={setThicknessMm}
                      suffix="mm"
                      step={0.1}
                    />

                    {!isDozerEndBit && !noHoles && (
                      <>
                        <NumberField
                          label={holeRows > 1 ? "Bolt holes (per row)" : "Bolt holes"}
                          value={holeCount}
                          onChange={setHoleCount}
                        />

                        <NumberField
                          label="Hole diameter"
                          value={holeDiameterMm}
                          onChange={setHoleDiameterMm}
                          suffix="mm"
                          step={0.1}
                        />
                      </>
                    )}
                  </div>

                  {isDozerEndBit && (
                    <p className="mt-3 text-xs text-slate-500">
                      Bolt hole count and layout are fixed for this shape
                      template — 7 holes, positions set automatically. No
                      manual entry needed.
                    </p>
                  )}
                </div>
              )}
            </section>

            {partIsSelected && !isDozerEndBit && (
              <section className="print-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold">Coating pattern for this part</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Pick a pattern this part has used before, or create a new one.
                  </p>
                </div>

                <div className="p-5">
                  {isLoadingPatterns && (
                    <p className="text-sm text-slate-500">Loading saved patterns…</p>
                  )}

                  {patternsLoadError && (
                    <p className="text-sm text-red-700">{patternsLoadError}</p>
                  )}

                  {!isLoadingPatterns && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {patternOptions.map((pattern) => {
                        const isActive =
                          !isCreatingNewPattern && oemPartPatternId === pattern.id;

                        return (
                          <button
                            key={pattern.id}
                            type="button"
                            onClick={() => loadPattern(pattern)}
                            className={`rounded-md border p-3 text-left transition ${
                              isActive
                                ? "border-slate-900 ring-2 ring-slate-200"
                                : "border-slate-300 hover:border-slate-400"
                            }`}
                          >
                            <div className="mb-2 overflow-hidden rounded border border-slate-200 bg-slate-50">
                              <CoatingLayout
                                lengthMm={lengthMm || 100}
                                widthMm={widthMm || 100}
                                thicknessMm={thicknessMm || 20}
                                holeCount={holeCount}
                                holeDiameterMm={holeDiameterMm}
                                holeRows={holeRows}
                                holeOffset={holeOffset}
                                holeRowSpacingMm={holeRowSpacingMm}
                                holeOffsetMm={holeOffsetMm}
                                edgeProfile={edgeProfile}
                                topBevelRuns={pattern.bevelRunsPerSide}
                                leadingEdgeRuns={pattern.leadingEdgeRunsPerSide}
                                bottomFaceRuns={pattern.bottomFaceRunsPerSide}
                                eyebrowType={pattern.eyebrowType}
                                eyebrowsPerHole={
                                  pattern.eyebrowType === "short"
                                    ? pattern.shortEyebrowsPerHole
                                    : 0
                                }
                                runWidthMm={runWidthMm}
                              />
                            </div>

                            <div className="text-sm font-semibold">
                              {pattern.patternLabel}
                            </div>

                            <div className="mt-0.5 text-xs text-slate-500">
                              Bevel {pattern.bevelRunsPerSide} · Leading{" "}
                              {pattern.leadingEdgeRunsPerSide} · Bottom{" "}
                              {pattern.bottomFaceRunsPerSide}
                              {pattern.eyebrowType !== "none" && (
                                <> · {pattern.eyebrowType} eyebrows</>
                              )}
                            </div>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={startNewPattern}
                        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-3 text-sm font-medium transition ${
                          isCreatingNewPattern
                            ? "border-slate-900 bg-slate-50 text-slate-900"
                            : "border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <span className="text-lg leading-none">+</span>
                        Create new pattern
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {isDozerEndBit ? (
              <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold">Coating pattern (Dozer End Bit)</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Full length runs follow the tapered working edge. Shoulder
                    runs are short ~100mm strips that sit immediately above
                    however many full-length runs are entered.
                  </p>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <NumberField
                    label="Full length runs"
                    value={endBitFullLengthRuns}
                    onChange={(value) =>
                      setEndBitFullLengthRuns(Math.max(0, Math.min(5, value)))
                    }
                  />

                  <NumberField
                    label="Shoulder runs"
                    value={endBitShoulderRuns}
                    onChange={(value) =>
                      setEndBitShoulderRuns(Math.max(0, Math.min(5, value)))
                    }
                  />
                </div>

                <div className="border-t border-slate-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
                  Pricing isn&apos;t available for Dozer End Bits yet — run-length
                  data for this shape hasn&apos;t been entered. Area, cost and sell
                  price will show as $0 until that&apos;s added.
                </div>
              </section>
            ) : (
              <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">Coating pattern</h3>

                    {!isLoadingSettings && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
                          Run width: {runWidthMm} mm
                        </span>
                        {eyebrowType === "short" && (
                          <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
                            Eyebrow length: {eyebrowLengthMm} mm
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {partIsSelected && !isCreatingNewPattern && oemPartPatternId
                      ? "Loaded from the selected pattern above — adjust if needed."
                      : partIsSelected
                        ? "Pick a pattern above, or enter one manually below."
                        : "Enter the coating pattern for this new part."}
                  </p>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <NumberField
                    label="Bevel runs per side"
                    value={topBevelRuns}
                    onChange={(value) => {
                      setTopBevelRuns(value);
                      setOemPartPatternId(null);
                    }}
                  />

                  <NumberField
                    label="Leading-edge runs per side"
                    value={leadingEdgeRuns}
                    onChange={(value) => {
                      setLeadingEdgeRuns(value);
                      setOemPartPatternId(null);
                    }}
                  />

                  <NumberField
                    label="Bottom-face runs per side"
                    value={bottomFaceRuns}
                    onChange={(value) => {
                      setBottomFaceRuns(value);
                      setOemPartPatternId(null);
                    }}
                  />

                  <NumberField
                    label="Left end runs"
                    value={leftEndRuns}
                    onChange={(value) => {
                      setLeftEndRuns(value);
                      setOemPartPatternId(null);
                    }}
                  />

                  <NumberField
                    label="Right end runs"
                    value={rightEndRuns}
                    onChange={(value) => {
                      setRightEndRuns(value);
                      setOemPartPatternId(null);
                    }}
                  />

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">
                      Eyebrow type
                    </span>

                    <select
                      value={eyebrowType}
                      onChange={(event) => {
                        setEyebrowType(
                          event.target.value as
                            | "none"
                            | "short"
                            | "full"
                        );
                        setOemPartPatternId(null);
                      }}
                      className="w-full rounded border border-slate-300 px-3 py-2"
                    >
                      <option value="none">None</option>
                      <option value="short">Short eyebrows</option>
                      <option value="full">Full-length eyebrows</option>
                    </select>
                  </label>

                  {eyebrowType === "short" && (
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">
                        Short eyebrows per hole
                      </span>

                      <select
                        value={shortEyebrowsPerHole}
                        onChange={(event) => {
                          setShortEyebrowsPerHole(
                            Number(event.target.value)
                          );
                          setOemPartPatternId(null);
                        }}
                        className="w-full rounded border border-slate-300 px-3 py-2"
                      >
                        <option value={1}>1 per hole</option>
                        <option value={2}>2 per hole</option>
                      </select>
                    </label>
                  )}

                  {eyebrowType === "full" && (
                    <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Two full-length runs: one on each side of the
                      bolt-hole row.
                    </div>
                  )}
                </div>

                <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm sm:grid-cols-5">
                  <SummaryItem
                    label="Full-length runs"
                    value={`${calculations.totalFullLengthRuns}`}
                  />

                  <SummaryItem
                    label="Eyebrows"
                    value={
                      eyebrowType === "full"
                        ? `${calculations.fullEyebrowRunQuantity} full-length`
                        : `${calculations.shortEyebrowQuantity} short`
                    }
                  />

                  <SummaryItem
                    label="End runs"
                    value={`${calculations.endRunQuantity}`}
                  />

                  <SummaryItem
                    label="Coated area"
                    value={`${calculations.totalAreaCm2.toFixed(0)} cm²`}
                  />

                  <SummaryItem
                    label="Carbide weight"
                    value={
                      calculations.carbideWeightG !== null
                        ? formatWeight(calculations.carbideWeightG)
                        : "—"
                    }
                  />
                </div>
              </section>
            )}

            <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold">Simple pricing</h3>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <div className={`contents ${isApproved ? "print:hidden" : ""}`}>
                  <ReadOnlyMoneyField
                    label="Carbide rate"
                    value={`${formatCurrency(carbideCostRatePerCm2)} / cm²`}
                    helper="Set by an administrator"
                  />

                  <ReadOnlyMoneyField
                    label="Total carbide cost"
                    value={formatCurrency(
                      calculations.totalCarbideCost
                    )}
                    helper={`${calculations.totalAreaCm2.toFixed(
                      0
                    )} cm² coated`}
                    emphasised
                  />
                </div>

                <CurrencyField
                  label="Sell rate (per cm²)"
                  value={sellRatePerCm2}
                  onChange={setSellRatePerCm2}
                />

                <ReadOnlyMoneyField
                  label="Total sell price"
                  value={formatCurrency(calculations.totalSellPrice)}
                  helper={`${calculations.totalAreaCm2.toFixed(
                    0
                  )} cm² × ${formatCurrency(sellRatePerCm2)}/cm²`}
                  emphasised
                />

                <div className={`contents ${isApproved ? "print:hidden" : ""}`}>
                  <ReadOnlyMoneyField
                    label="Gross profit"
                    value={formatCurrency(calculations.grossProfit)}
                  />

                  <ReadOnlyMoneyField
                    label="Gross margin"
                    value={`${calculations.grossMargin.toFixed(1)}%`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!showForm || isSaving || isSubmitting}
                  className="print-hidden rounded border border-slate-400 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? "Saving…" : "Save Draft"}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={!showForm || isSaving || isSubmitting || isDozerEndBit}
                  title={
                    isDozerEndBit
                      ? "Dozer End Bit pricing isn't available yet — run-length data still pending"
                      : undefined
                  }
                  className="print-hidden rounded bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting
                    ? "Saving…"
                    : editEstimateId
                      ? "Save Changes"
                      : "Submit for Approval"}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={!showForm}
                  className="print-hidden rounded bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Print / PDF
                </button>

                {estimateStatus && (
                  <StatusBadge status={estimateStatus} />
                )}

                {saveMessage && !actionError && (
                  <p className="text-sm text-emerald-700">
                    {saveMessage}
                  </p>
                )}

                {actionError && (
                  <p className="text-sm text-red-700">{actionError}</p>
                )}
              </div>

              {estimateId && (
                <div className="print-hidden border-t border-slate-200 px-5 py-4">
                  <span className="mb-2 block text-sm font-medium">
                    Confirmation photo
                  </span>

                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setPhotoFile(event.target.files?.[0] ?? null)
                      }
                      className="text-sm"
                    />

                    <button
                      type="button"
                      onClick={handleUploadPhoto}
                      disabled={!photoFile || isUploadingPhoto}
                      className="rounded border border-slate-400 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isUploadingPhoto ? "Uploading…" : "Upload Photo"}
                    </button>

                    {photoPath && (
                      <span className="text-sm text-emerald-700">
                        Photo attached
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Attach a photo of the finished edge for the admin to
                    check against this spec before approving.
                  </p>
                </div>
              )}

              {showForm && (
                <div className="hidden border-t border-slate-200 bg-slate-50 p-4 print:block">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Estimate
                  </div>

                  <div className="mt-3 space-y-2">
                    <SummaryRow label="OEM part" value={oemPartNumber} />

                    {customerName && (
                      <SummaryRow label="Customer" value={customerName} />
                    )}

                    {jobReference && (
                      <SummaryRow label="Job ref (Pronto)" value={jobReference} />
                    )}

                    {!isApproved && (
                      <SummaryRow
                        label="Carbide cost"
                        value={formatCurrency(calculations.totalCarbideCost)}
                      />
                    )}

                    <SummaryRow
                      label="Sell price"
                      value={formatCurrency(calculations.totalSellPrice)}
                      emphasised
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-lg border border-slate-300 bg-white shadow-sm xl:sticky xl:top-5">
            <div className="print-hidden flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="font-semibold">
                {isDozerEndBit ? "Front face view" : "Live coating layout"}
              </h3>

              {showForm && (
                <span className="text-xs font-medium text-slate-500">
                  Updates automatically
                </span>
              )}
            </div>

            <div className="p-4">
              {showForm ? (
                <>
                  <div className="overflow-hidden rounded border border-slate-300 bg-white p-3 print-drawing">
                    {isDozerEndBit ? (
                      <CoatingLayoutEndBit
                        hand={endBitHand}
                        fullLengthRuns={endBitFullLengthRuns}
                        shoulderRuns={endBitShoulderRuns}
                      />
                    ) : (
                      <CoatingLayout
                        lengthMm={lengthMm}
                        widthMm={widthMm}
                        thicknessMm={thicknessMm}
                        holeCount={holeCount}
                        holeDiameterMm={holeDiameterMm}
                        holeRows={holeRows}
                        holeOffset={holeOffset}
                        holeRowSpacingMm={holeRowSpacingMm}
                        holeOffsetMm={holeOffsetMm}
                        edgeProfile={edgeProfile}
                        topBevelRuns={topBevelRuns}
                        leadingEdgeRuns={leadingEdgeRuns}
                        bottomFaceRuns={bottomFaceRuns}
                        eyebrowType={eyebrowType}
                        eyebrowsPerHole={
                          eyebrowType === "short" ? shortEyebrowsPerHole : 0
                        }
                        runWidthMm={runWidthMm}
                        leftEndRuns={leftEndRuns}
                        rightEndRuns={rightEndRuns}
                      />
                    )}
                  </div>

                  <div className="print-hidden mt-4 rounded border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Estimate
                    </div>

                    <div className="mt-3 space-y-2">
                      <SummaryRow
                        label="OEM part"
                        value={oemPartNumber}
                      />

                      {customerName && (
                        <SummaryRow label="Customer" value={customerName} />
                      )}

                      {jobReference && (
                        <SummaryRow label="Job ref (Pronto)" value={jobReference} />
                      )}

                      <SummaryRow
                        label="Carbide cost"
                        value={formatCurrency(
                          calculations.totalCarbideCost
                        )}
                      />

                      <SummaryRow
                        label="Sell price"
                        value={formatCurrency(calculations.totalSellPrice)}
                        emphasised
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-80 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  The coating drawing will appear here after you
                  select an OEM part.
                </div>
              )}
            </div>
          </aside>
        </div>

        {false && showForm && (
          <section className="print-hidden mt-5 rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="font-semibold">3D Preview</h3>
              <span className="text-xs font-medium text-slate-500">
                Illustrative — not to a single consistent scale
              </span>
            </div>

            <div className="p-4">
              <CoatingLayout3D
                lengthMm={lengthMm}
                widthMm={widthMm}
                thicknessMm={thicknessMm}
                holeCount={holeCount}
                holeRows={holeRows}
                holeOffset={holeOffset}
                edgeProfile={edgeProfile}
                topBevelRuns={topBevelRuns}
                leadingEdgeRuns={leadingEdgeRuns}
                bottomFaceRuns={bottomFaceRuns}
              />
            </div>
          </section>
        )}

        {!isApproved && (
          <div className="print-watermark" aria-hidden="true">
            <span>Internal Use Only - Unapproved</span>
          </div>
        )}

        <div className="print-footer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tc-applicator-logo.png" alt="TC Applicator" className="print-footer-logo" />

          <div className="print-footer-meta">
            <span>Printed: {printDate}</span>
            <span>Prepared by: {printPreparedBy || "—"}</span>
          </div>

          {printCompanyLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={printCompanyLogoUrl}
              alt={printCompanyName || "Company logo"}
              className="print-footer-logo"
            />
          )}
        </div>

        <style jsx global>{`
          .print-watermark {
            display: none;
          }

          .print-footer {
            display: none;
          }

          .print-layout-grid {
            display: block !important;
          }

          .print-drawing svg {
            min-width: 0 !important;
            width: 100% !important;
            max-width: 650px;
            margin: 0 auto;
            display: block;
          }

          .print-title-page {
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }

          .print-title-logo {
            max-height: 60px;
            width: auto;
          }

          .print-title-text {
            flex: 1;
            text-align: center;
          }

          .print-title-text h1 {
            margin: 0 0 4px;
            font-size: 26px;
            font-weight: 800;
          }

          .print-title-text p {
            margin: 2px 0;
            font-size: 13px;
            color: #475569;
          }

          @media print {
            .print-watermark {
              display: flex;
              position: fixed;
              inset: 0;
              align-items: center;
              justify-content: center;
              pointer-events: none;
              z-index: 9999;
            }

            .print-watermark span {
              transform: rotate(-28deg);
              font-size: 40px;
              font-weight: 800;
              letter-spacing: 1px;
              color: rgba(220, 38, 38, 0.32);
              white-space: nowrap;
            }

            .print-footer {
              display: flex;
              position: fixed;
              bottom: 4mm;
              left: 8mm;
              right: 8mm;
              align-items: center;
              justify-content: space-between;
              border-top: 1px solid #cbd5e1;
              padding-top: 4px;
              font-size: 9px;
              color: #64748b;
              z-index: 9998;
            }

            .print-footer-logo {
              max-height: 22px;
              width: auto;
            }

            .print-footer-meta {
              display: flex;
              flex-direction: column;
              text-align: center;
            }

            .print-hidden {
              display: none !important;
            }

            section {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            body {
              padding-bottom: 14mm;
            }
          }
        `}</style>
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
};

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: NumberFieldProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function commit(raw: string) {
    const parsed = Number(raw);
    onChange(Number.isFinite(parsed) && raw.trim() !== "" ? parsed : 0);
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
      </span>

      <div className="flex">
        <input
          type="number"
          min="0"
          step={step}
          value={text}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);

            if (raw.trim() !== "" && Number.isFinite(Number(raw))) {
              onChange(Number(raw));
            }
          }}
          onBlur={(event) => commit(event.target.value)}
          className={
            suffix
              ? "min-w-0 flex-1 rounded-l border border-slate-300 px-3 py-2"
              : "min-w-0 flex-1 rounded border border-slate-300 px-3 py-2"
          }
        />

        {suffix && (
          <span className="flex items-center rounded-r border border-l-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-600">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

type ReadOnlyMoneyFieldProps = {
  label: string;
  value: string;
  helper?: string;
  emphasised?: boolean;
};

function ReadOnlyMoneyField({
  label,
  value,
  helper,
  emphasised = false,
}: ReadOnlyMoneyFieldProps) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium">{label}</div>

      <div
        className={`rounded border border-slate-200 bg-slate-50 px-3 py-2 ${
          emphasised ? "text-lg font-semibold" : ""
        }`}
      >
        {value}
      </div>

      {helper && (
        <div className="mt-1 text-xs text-slate-500">
          {helper}
        </div>
      )}
    </div>
  );
}

type CurrencyFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  emphasised?: boolean;
};

function CurrencyField({
  label,
  value,
  onChange,
  emphasised = false,
}: CurrencyFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
      </span>

      <div className="flex">
        <span className="flex items-center rounded-l border border-r-0 border-slate-300 bg-slate-50 px-3 text-slate-600">
          $
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value || ""}
          onChange={(event) =>
            onChange(Number(event.target.value) || 0)
          }
          className={`min-w-0 flex-1 rounded-r border border-slate-300 px-3 py-2 ${
            emphasised ? "text-lg font-semibold" : ""
          }`}
          placeholder="0.00"
        />
      </div>
    </label>
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  emphasised?: boolean;
};

function SummaryRow({
  label,
  value,
  emphasised = false,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span
        className={
          emphasised
            ? "font-semibold text-slate-900"
            : "text-sm font-medium text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: EstimateStatus }) {
  const labels: Record<EstimateStatus, string> = {
    draft: "Draft",
    pending_approval: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
  };

  const classes: Record<EstimateStatus, string> = {
    draft: "border-slate-300 bg-slate-100 text-slate-700",
    pending_approval: "border-amber-300 bg-amber-50 text-amber-800",
    approved: "border-emerald-300 bg-emerald-50 text-emerald-800",
    rejected: "border-red-300 bg-red-50 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}