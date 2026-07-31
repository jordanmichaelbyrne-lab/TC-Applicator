import Link from "next/link";
import {
  getCompanyOverview,
  getSignedCompanyLogoUrl,
  type CompanyOverviewDetail,
} from "@/app/lib/repositories/platformOverview";
import { setCompanyLogoAction, removeCompanyLogoAction } from "./logo-actions";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

type PageProps = {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function AdminCompanyDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { companyId } = await params;
  const { error, success } = await searchParams;

  let overview: CompanyOverviewDetail | null = null;
  let errorMessage: string | null = null;

  try {
    overview = await getCompanyOverview(companyId);
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Unable to load this company.";
    console.error("[admin/companies/detail] failed to load:", err);
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

  if (!overview) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-900">
        <div className="rounded-md border border-slate-300 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">Company not found</h1>
          <Link
            href="/admin/companies"
            className="mt-4 inline-block rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Back to Companies
          </Link>
        </div>
      </main>
    );
  }

  const logoSignedUrl = overview.logoUrl
    ? await getSignedCompanyLogoUrl(overview.logoUrl)
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{overview.name}</h1>
            <p className="text-sm text-slate-500">Read-only support view</p>
          </div>

          <Link
            href="/admin/companies"
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to Companies
          </Link>
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

        <section className="rounded-md border border-slate-300 bg-white p-5">
          <h3 className="mb-3 font-semibold">Company Logo</h3>
          <p className="mb-4 text-sm text-slate-600">
            Set by TC Applicator Support. Shown to everyone at{" "}
            {overview.name} in their navbar.
          </p>

          <div className="mb-4 flex h-20 items-center rounded border border-dashed border-slate-300 bg-slate-50 px-4">
            {logoSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSignedUrl}
                alt={`${overview.name} logo`}
                className="max-h-16 w-auto"
              />
            ) : (
              <span className="text-sm text-slate-500">
                No logo set yet.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form
              action={setCompanyLogoAction}
              className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
            >
              <input type="hidden" name="companyId" value={overview.id} />
              <input
                type="file"
                name="logo"
                accept="image/*"
                required
                className="flex-1 text-sm"
              />
              <button
                type="submit"
                className="rounded border border-slate-400 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                {logoSignedUrl ? "Replace Logo" : "Upload Logo"}
              </button>
            </form>

            {logoSignedUrl && (
              <form action={removeCompanyLogoAction}>
                <input type="hidden" name="companyId" value={overview.id} />
                <button
                  type="submit"
                  className="rounded border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Remove Logo
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="rounded-md border border-slate-300 bg-white">
          <div className="border-b border-slate-300 px-5 py-4">
            <h3 className="font-semibold">
              Members ({overview.members.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-200">
            {overview.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span>{member.full_name || "—"}</span>
                <span className="text-xs text-slate-500">
                  {member.is_platform_admin ? "TC Applicator Support · " : ""}
                  {member.is_admin ? "Administrator" : "Member"}
                </span>
              </div>
            ))}

            {overview.members.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-slate-500">
                No members yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-md border border-slate-300 bg-white">
          <div className="border-b border-slate-300 px-5 py-4">
            <h3 className="font-semibold">Recent Estimates</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    OEM Part
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sell Price
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {overview.recentEstimates.map((estimate) => (
                  <tr key={estimate.id}>
                    <td className="px-5 py-3">{estimate.oem_part_number}</td>
                    <td className="px-5 py-3">
                      {estimate.customer_name || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {formatCurrency(estimate.total_sell_price)}
                    </td>
                    <td className="px-5 py-3 capitalize">
                      {estimate.status.replace("_", " ")}
                    </td>
                  </tr>
                ))}

                {overview.recentEstimates.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      No estimates yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-md border border-slate-300 bg-white p-5">
          <h3 className="font-semibold">OEM Parts Catalog</h3>
          <p className="mt-1 text-sm text-slate-600">
            {overview.oemPartCount} part(s) on file.
          </p>
        </section>
    </div>
  );
}