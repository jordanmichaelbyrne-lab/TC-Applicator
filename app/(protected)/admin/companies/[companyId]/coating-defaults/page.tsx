import Link from "next/link";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { getCompanyOverview } from "@/app/lib/repositories/platformOverview";
import { getCompanySettingsForPlatformAdmin } from "@/app/lib/settings/companySettings";

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function AdminCompanyCoatingDefaultsPage({ params }: PageProps) {
  const { companyId } = await params;
  const { isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 text-xl font-semibold">Coating Defaults</h1>
        <p className="text-sm text-slate-600">
          Only TC Applicator Support can view this.
        </p>
      </div>
    );
  }

  const [overview, settings] = await Promise.all([
    getCompanyOverview(companyId),
    getCompanySettingsForPlatformAdmin(companyId),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold">
            {overview?.name || "Company"} — Coating Defaults
          </h1>
          <p className="text-sm text-slate-600">
            Read-only support view. Values used as starting defaults for
            this company&apos;s new estimates.
          </p>
        </div>

        <Link
          href={`/admin/companies/${companyId}`}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to Company
        </Link>
      </div>

      {!settings ? (
        <div className="rounded-md border border-slate-300 bg-white p-6 text-sm text-slate-500">
          This company hasn&apos;t saved any Coating Defaults yet.
        </div>
      ) : (
        <div className="space-y-4 rounded-md border border-slate-300 bg-white p-6">
          <SettingRow
            label="Carbide cost rate"
            value={`$${settings.carbide_cost_rate_per_cm2.toFixed(4)} / cm²`}
          />
          <SettingRow
            label="Standard run width"
            value={`${settings.run_width_mm} mm`}
          />
          <SettingRow
            label="Short eyebrow length"
            value={`${settings.eyebrow_length_mm} mm`}
          />
          <SettingRow
            label="2-row hole spacing"
            value={`${settings.hole_row_spacing_mm} mm`}
          />
          <SettingRow
            label="Hole offset from edge"
            value={`${settings.hole_offset_mm} mm`}
          />
        </div>
      )}
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}