import Link from "next/link";
import {
  listPlatformPendingRequests,
  listCompaniesForAssignment,
  type SignupRequestRow,
} from "@/app/lib/repositories/signupRequests";
import { platformApproveAction, platformRejectAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function PlatformSignupsPage({
  searchParams,
}: PageProps) {
  const { error, success } = await searchParams;

  let requests: SignupRequestRow[] = [];
  let companies: { id: string; name: string }[] = [];
  let errorMessage: string | null = null;

  try {
    [requests, companies] = await Promise.all([
      listPlatformPendingRequests(),
      listCompaniesForAssignment(),
    ]);
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Unable to load signup requests.";
    console.error("[admin/signups] failed to load:", err);
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
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
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

        {requests.length === 0 && (
          <div className="rounded-md border border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No pending signup requests.
          </div>
        )}

        {requests.map((request) => (
          <section
            key={request.id}
            className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm"
          >
            <div className="mb-4">
              <div className="font-semibold">{request.full_name}</div>
              <div className="text-sm text-slate-600">{request.email}</div>
              <div className="mt-1 text-sm text-slate-500">
                Requested company:{" "}
                <strong>{request.requested_company_name}</strong>
              </div>

              {request.platform_approved_at && (
                <div className="mt-1 text-xs text-emerald-700">
                  Already approved at platform level — waiting on that
                  company&apos;s manager.
                </div>
              )}
            </div>

            <form action={platformApproveAction} className="space-y-3">
              <input type="hidden" name="requestId" value={request.id} />

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Assign to existing company
                  </span>
                  <select
                    name="existingCompanyId"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">— none —</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Or create a new company
                  </span>
                  <input
                    name="newCompanyName"
                    placeholder={request.requested_company_name}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Approve (Platform)
              </button>
            </form>

            <form
              action={platformRejectAction}
              className="mt-3 flex flex-col gap-2 sm:flex-row"
            >
              <input type="hidden" name="requestId" value={request.id} />
              <input
                name="reason"
                placeholder="Reason for rejection (optional)"
                className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Reject
              </button>
            </form>
          </section>
        ))}
    </div>
  );
}