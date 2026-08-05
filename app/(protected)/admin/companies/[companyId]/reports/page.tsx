import Link from "next/link";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { getCompanyOverview } from "@/app/lib/repositories/platformOverview";
import { getReportDataForCompanyAction } from "@/app/(protected)/reports/actions";
import ReportView from "@/app/(protected)/reports/ReportView";

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function AdminCompanyReportsPage({ params }: PageProps) {
  const { companyId } = await params;
  const { isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isPlatformAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 text-xl font-semibold">Reports</h1>
        <p className="text-sm text-slate-600">
          Only TC Applicator Support can view this.
        </p>
      </div>
    );
  }

  const overview = await getCompanyOverview(companyId);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="print-hidden mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {overview?.name || "Company"} — Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Read-only support view. True cost is drawn from this
            company&apos;s own Cost Analysis history.
          </p>
        </div>

        <Link
          href={`/admin/companies/${companyId}`}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to Company
        </Link>
      </div>

      <ReportView fetchData={getReportDataForCompanyAction.bind(null, companyId)} />
    </div>
  );
}