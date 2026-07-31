import Link from "next/link";
import {
  listAllCompaniesOverview,
  type CompanyOverviewSummary,
} from "@/app/lib/repositories/platformOverview";
export default async function AdminCompaniesPage() {
  let companies: CompanyOverviewSummary[] = [];
  let errorMessage: string | null = null;

  try {
    companies = await listAllCompaniesOverview();
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Unable to load companies.";
    console.error("[admin/companies] failed to load:", err);
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-900">
        <div className="max-w-md rounded-md border border-slate-300 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">Unable to load this page</h1>
          <p className="mt-2 text-sm text-slate-600">{errorMessage}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
        <section className="rounded-md border border-slate-300 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>Company</TableHeading>
                  <TableHeading>Members</TableHeading>
                  <TableHeading>Draft</TableHeading>
                  <TableHeading>Pending</TableHeading>
                  <TableHeading>Approved</TableHeading>
                  <TableHeading>Rejected</TableHeading>
                  <TableHeading>Actions</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {company.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      {company.memberCount} ({company.adminCount} admin
                      {company.adminCount === 1 ? "" : "s"})
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      {company.estimateCounts.draft}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      {company.estimateCounts.pending_approval}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      {company.estimateCounts.approved}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      {company.estimateCounts.rejected}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {companies.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      No companies yet.
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

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
    >
      {children}
    </th>
  );
}