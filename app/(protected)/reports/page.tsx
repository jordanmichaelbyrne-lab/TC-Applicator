import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { getReportDataAction } from "./actions";
import ReportView from "./ReportView";

export default async function ReportsPage() {
  const { isDirector, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isDirector && !isPlatformAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 text-xl font-semibold">Reports</h1>
        <p className="text-sm text-slate-600">
          Only a company director can view this.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="print-hidden mb-6">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Revenue, true cost and margin on approved jobs — true cost
          is drawn from your Cost Analysis history, not the sales
          rate estimators quote against.
        </p>
      </div>

      <ReportView fetchData={getReportDataAction} />
    </div>
  );
}