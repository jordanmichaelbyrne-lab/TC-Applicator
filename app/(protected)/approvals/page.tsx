import Link from "next/link";
import CoatingLayout from "@/components/drawing/CoatingLayout";
import {
  listPendingApprovals,
  getSignedPhotoUrl,
} from "@/app/lib/repositories/estimates";
import {
  approveEstimateAction,
  rejectEstimateAction,
} from "@/app/(protected)/estimates/actions";
import { getCompanySettings } from "@/app/lib/settings/companySettings";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

type ApprovalsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    warning?: string;
  }>;
};

export default async function ApprovalsPage({
  searchParams,
}: ApprovalsPageProps) {
  const { error, success, warning } = await searchParams;
  const pending = await listPendingApprovals();
  const settings = await getCompanySettings();

  const withPhotos = await Promise.all(
    pending.map(async (estimate) => ({
      estimate,
      photoUrl: estimate.photo_url
        ? await getSignedPhotoUrl(estimate.photo_url)
        : null,
    }))
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        <div>
          <h2 className="text-2xl font-semibold">Pending Approvals</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review the spec, drawing, and confirmation photo before approving.
          </p>
        </div>

        {error && (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {warning && (
          <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {warning}
          </div>
        )}

        {withPhotos.length === 0 && (
          <div className="rounded-md border border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No estimates awaiting approval.
          </div>
        )}

        {withPhotos.map(({ estimate, photoUrl }) => (
          <section
            key={estimate.id}
            className="rounded-lg border border-slate-300 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold">
                  {estimate.oem_part_number}
                </div>

                <div className="text-sm text-slate-600">
                  {estimate.manufacturer || "—"} · {estimate.edge_type || "—"} ·{" "}
                  {estimate.edge_profile}
                </div>

                {(estimate.customer_name || estimate.job_reference) && (
                  <div className="mt-1 text-sm text-slate-500">
                    {estimate.customer_name && (
                      <span>{estimate.customer_name}</span>
                    )}
                    {estimate.customer_name && estimate.job_reference && (
                      <span> · </span>
                    )}
                    {estimate.job_reference && (
                      <span>Pronto job {estimate.job_reference}</span>
                    )}
                  </div>
                )}
              </div>

              <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Pending Approval
              </span>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_360px]">
              <div className="overflow-hidden rounded border border-slate-300 bg-white p-3">
                <CoatingLayout
                  lengthMm={estimate.length_mm}
                  widthMm={estimate.width_mm}
                  thicknessMm={estimate.thickness_mm}
                  holeCount={estimate.hole_count}
                  holeDiameterMm={estimate.hole_diameter_mm ?? undefined}
                  holeRows={
                    estimate.hole_rows === 2
                      ? 2
                      : estimate.hole_rows === 3
                        ? 3
                        : 1
                  }
                  holeOffset={Boolean(estimate.hole_offset)}
                  holeRowSpacingMm={settings.hole_row_spacing_mm}
                  holeOffsetMm={settings.hole_offset_mm}
                  edgeProfile={estimate.edge_profile}
                  topBevelRuns={estimate.bevel_runs_per_side}
                  leadingEdgeRuns={estimate.leading_edge_runs_per_side}
                  bottomFaceRuns={estimate.bottom_face_runs_per_side}
                  eyebrowType={estimate.eyebrow_type}
                  eyebrowsPerHole={estimate.short_eyebrows_per_hole}
                />
              </div>

              <div className="space-y-4">
                <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-slate-500">Dimensions</span>
                    <span className="font-medium">
                      {estimate.length_mm} × {estimate.width_mm} ×{" "}
                      {estimate.thickness_mm} mm
                    </span>

                    <span className="text-slate-500">Bolt holes</span>
                    <span className="font-medium">
                      {estimate.hole_count} × Ø
                      {estimate.hole_diameter_mm ?? "—"} mm
                      {estimate.hole_rows > 1 ? ` (${estimate.hole_rows} row)` : ""}
                      {estimate.hole_offset ? ", offset" : ""}
                    </span>

                    <span className="text-slate-500">Coated area</span>
                    <span className="font-medium">
                      {estimate.total_area_cm2 !== null
                        ? `${estimate.total_area_cm2.toFixed(0)} cm²`
                        : "—"}
                    </span>

                    <span className="text-slate-500">Carbide cost</span>
                    <span className="font-medium">
                      {formatCurrency(estimate.total_carbide_cost)}
                    </span>

                    <span className="text-slate-500">Sell price</span>
                    <span className="font-medium">
                      {formatCurrency(estimate.total_sell_price)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium">
                    Confirmation photo
                  </div>

                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt={`Confirmation photo for ${estimate.oem_part_number}`}
                      className="w-full rounded border border-slate-300"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                      No photo attached yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-start">
              <form action={approveEstimateAction}>
                <input type="hidden" name="estimateId" value={estimate.id} />
                <button
                  type="submit"
                  className="rounded bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Approve
                </button>
              </form>

              <Link
                href={`/estimates/new?estimateId=${estimate.id}`}
                className="rounded border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
              >
                Edit
              </Link>

              <form
                action={rejectEstimateAction}
                className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
              >
                <input type="hidden" name="estimateId" value={estimate.id} />
                <input
                  name="reason"
                  placeholder="Reason for rejection (optional)"
                  className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Reject
                </button>
              </form>
            </div>
          </section>
        ))}
    </div>
  );
}