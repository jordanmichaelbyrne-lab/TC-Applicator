import Link from "next/link";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { getCompanyOverview } from "@/app/lib/repositories/platformOverview";
import { listCostAnalysisSnapshotsForPlatformAdmin } from "@/app/lib/repositories/costAnalysis";

function formatCurrency(value: number, decimals = 3) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function AdminCompanyCostAnalysisPage({ params }: PageProps) {
  const { companyId } = await params;
  const { isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 text-xl font-semibold">Cost Analysis</h1>
        <p className="text-sm text-slate-600">
          Only TC Applicator Support can view this.
        </p>
      </div>
    );
  }

  const [overview, snapshots] = await Promise.all([
    getCompanyOverview(companyId),
    listCostAnalysisSnapshotsForPlatformAdmin(companyId),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {overview?.name || "Company"} — Cost Analysis
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Read-only support view. Saved true-cost snapshots, most recent first.
          </p>
        </div>

        <Link
          href={`/admin/companies/${companyId}`}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to Company
        </Link>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-500">Saved</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-500">True Cost</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-500">
                  Sales Reference
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-500">Buffer</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-500">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {snapshots.map((snapshot) => (
                <tr key={snapshot.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                    {formatDate(snapshot.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 font-medium">
                    {formatCurrency(snapshot.true_cost_per_cm2)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 font-medium">
                    {formatCurrency(snapshot.buffered_sales_cost_per_cm2)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                    +{snapshot.buffer_pct}%
                  </td>
                  <td className="px-4 py-2 text-slate-500">{snapshot.notes || "—"}</td>
                </tr>
              ))}

              {snapshots.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    This company hasn&apos;t saved any Cost Analysis snapshots yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}