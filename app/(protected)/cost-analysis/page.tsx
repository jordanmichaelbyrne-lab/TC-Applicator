import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import CostAnalysisForm from "./CostAnalysisForm";

export default async function CostAnalysisPage() {
  const { isDirector, isPlatformAdmin } = await getCurrentUserAndCompany();

  if (!isDirector && !isPlatformAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 text-xl font-semibold">Cost Analysis</h1>
        <p className="text-sm text-slate-600">
          Only a company director can view this.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Cost Analysis</h1>
        <p className="mt-1 text-sm text-slate-600">
          The true production cost per cm² of coating — tungsten,
          wire, labour, rental and electricity. For internal
          recordkeeping only; this never affects live estimate
          pricing, which stays a manually set rate under Coating
          Defaults.
        </p>
      </div>

      <CostAnalysisForm />
    </div>
  );
}