import Link from "next/link";
import QuoteSpecSheet from "@/components/quotes/QuoteSpecSheet";
import {
  getEstimate,
  getSignedPhotoUrl,
  type EstimateRow,
} from "@/app/lib/repositories/estimates";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { getSignedCompanyLogoUrl } from "@/app/lib/repositories/platformOverview";
import { getCompanySettings } from "@/app/lib/settings/companySettings";

function computeAreaBreakdown(
  estimate: EstimateRow,
  runWidthMm: number,
  eyebrowLengthMm: number
) {
  const profileMultiplier = estimate.edge_profile === "double-bevel" ? 2 : 1;

  const bevelRunQuantity =
    estimate.edge_profile === "square-edge"
      ? 0
      : estimate.bevel_runs_per_side * profileMultiplier;
  const leadingEdgeRunQuantity =
    estimate.leading_edge_runs_per_side * profileMultiplier;
  const bottomFaceRunQuantity =
    estimate.bottom_face_runs_per_side * (estimate.hole_offset ? 1 : 2);
  const fullEyebrowRunQuantity = estimate.eyebrow_type === "full" ? 2 : 0;

  const totalFullLengthRuns =
    bevelRunQuantity +
    leadingEdgeRunQuantity +
    bottomFaceRunQuantity +
    fullEyebrowRunQuantity;

  const fullLengthAreaMm2 =
    estimate.length_mm * runWidthMm * totalFullLengthRuns;

  const eyebrowHoleMultiplier =
    estimate.hole_count === 0 ? 0 : Math.max(estimate.hole_rows, 1);
  const shortEyebrowQuantity =
    estimate.eyebrow_type === "short"
      ? estimate.hole_count * eyebrowHoleMultiplier * estimate.short_eyebrows_per_hole
      : 0;

  const shortEyebrowAreaMm2 =
    shortEyebrowQuantity * eyebrowLengthMm * runWidthMm;

  const eyebrowQuantity =
    estimate.eyebrow_type === "full"
      ? fullEyebrowRunQuantity
      : shortEyebrowQuantity;

  return {
    totalFullLengthRuns,
    eyebrowQuantity,
    fullLengthAreaCm2: fullLengthAreaMm2 / 100,
    eyebrowAreaCm2: shortEyebrowAreaMm2 / 100,
  };
}

function toQuoteNumber(estimateId: string) {
  return `TC-${estimateId.slice(0, 8).toUpperCase()}`;
}

type DrawingDetailPageProps = {
  params: Promise<{ estimateId: string }>;
};

export default async function DrawingDetailPage({
  params,
}: DrawingDetailPageProps) {
  const { estimateId } = await params;
  const estimate = await getEstimate(estimateId);

  if (!estimate) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded border border-slate-300 bg-white p-8 text-center">
            <h1 className="text-xl font-semibold">Drawing not found</h1>
            <p className="mt-2 text-sm text-slate-600">
              This estimate may not exist, or your company doesn&apos;t have
              access to it.
            </p>

            <Link
              href="/drawings"
              className="mt-6 inline-block rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Back to Approved Drawings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const photoUrl = estimate.photo_url
    ? await getSignedPhotoUrl(estimate.photo_url)
    : null;

  const { companyName, companyLogoPath } = await getCurrentUserAndCompany();
  const companyLogoUrl = companyLogoPath
    ? await getSignedCompanyLogoUrl(companyLogoPath)
    : null;

  const settings = await getCompanySettings();

  // Prefer the settings snapshotted onto the estimate at save time —
  // only fall back to the company's current settings for estimates
  // created before that snapshot existed (run_width_mm etc. will be
  // null on those older rows). This is what stops a later change to
  // Coating Defaults from retroactively altering an already-approved
  // drawing's displayed run width, eyebrow length, or hole layout.
  const effectiveRunWidthMm = estimate.run_width_mm ?? settings.run_width_mm;
  const effectiveEyebrowLengthMm = estimate.eyebrow_length_mm ?? settings.eyebrow_length_mm;
  const effectiveHoleRowSpacingMm = estimate.hole_row_spacing_mm ?? settings.hole_row_spacing_mm;
  const effectiveHoleOffsetMm = estimate.hole_offset_mm ?? settings.hole_offset_mm;

  const { totalFullLengthRuns, eyebrowQuantity, fullLengthAreaCm2, eyebrowAreaCm2 } =
    computeAreaBreakdown(estimate, effectiveRunWidthMm, effectiveEyebrowLengthMm);

  const costPrice = estimate.total_carbide_cost ?? 0;
  const sellPrice = estimate.total_sell_price ?? 0;
  const grossProfit = sellPrice - costPrice;
  const grossMargin = sellPrice > 0 ? (grossProfit / sellPrice) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-4 flex justify-end">
          <Link
            href="/drawings"
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to Approved Drawings
          </Link>
        </div>

        {photoUrl && (
          <section className="print-hidden mb-6 rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">Confirmation Photo</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={`Confirmation photo for ${estimate.oem_part_number}`}
              className="max-h-96 w-full rounded border border-slate-300 object-contain"
            />
          </section>
        )}

        <QuoteSpecSheet
          quoteNumber={toQuoteNumber(estimate.id)}
          quoteDate={(estimate.approved_at ?? estimate.created_at).slice(0, 10)}
          companyName={companyName}
          companyLogoUrl={companyLogoUrl}
          customer={estimate.customer_name ?? ""}
          jobReference={estimate.job_reference ?? undefined}
          oemPartNumber={estimate.oem_part_number}
          manufacturer={estimate.manufacturer ?? ""}
          machineType={estimate.machine_type ?? ""}
          machineModel={estimate.machine_model ?? undefined}
          edgeType={estimate.edge_type ?? ""}
          profileFamily={estimate.edge_profile}
          lengthMm={estimate.length_mm}
          widthMm={estimate.width_mm}
          thicknessMm={estimate.thickness_mm}
          holeCount={estimate.hole_count}
          holeDiameterMm={estimate.hole_diameter_mm ?? 0}
          holeRows={estimate.hole_rows === 2 ? 2 : estimate.hole_rows === 3 ? 3 : 1}
          holeOffset={Boolean(estimate.hole_offset)}
          holeRowSpacingMm={effectiveHoleRowSpacingMm}
          holeOffsetMm={effectiveHoleOffsetMm}
          bevelRunsPerSide={estimate.bevel_runs_per_side}
          leadingEdgeRunsPerSide={estimate.leading_edge_runs_per_side}
          bottomFaceRunsPerSide={estimate.bottom_face_runs_per_side}
          eyebrowType={estimate.eyebrow_type}
          eyebrowsPerHole={estimate.short_eyebrows_per_hole}
          runWidthMm={effectiveRunWidthMm}
          totalFullLengthRuns={totalFullLengthRuns}
          eyebrowQuantity={eyebrowQuantity}
          fullLengthAreaCm2={fullLengthAreaCm2}
          eyebrowAreaCm2={eyebrowAreaCm2}
          totalAreaCm2={estimate.total_area_cm2 ?? 0}
          costRate={estimate.carbide_cost_rate_per_cm2 ?? 0}
          sellRate={estimate.sell_rate_per_cm2 ?? 0}
          costPrice={costPrice}
          sellPrice={sellPrice}
          grossProfit={grossProfit}
          grossMargin={grossMargin}
          notes={estimate.notes ?? undefined}
        />
    </div>
  );
}