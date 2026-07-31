import {
  listCompanyPendingRequests,
  type SignupRequestRow,
} from "@/app/lib/repositories/signupRequests";
import { managerApproveAction, managerRejectAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function TeamRequestsPage({ searchParams }: PageProps) {
  const { error, success } = await searchParams;

  let requests: SignupRequestRow[] = [];
  let errorMessage: string | null = null;

  try {
    requests = await listCompanyPendingRequests();
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Unable to load team requests.";
    console.error("[team-requests] failed to load:", err);
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
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
        <div>
          <h1 className="text-xl font-semibold">Team Access Requests</h1>
          <p className="text-sm text-slate-500">
            People asking to join your company on TC Applicator
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

        {requests.length === 0 && (
          <div className="rounded-md border border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No pending requests to join your company.
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
              <div className="mt-1 text-xs text-emerald-700">
                Already approved by TC Applicator Support — your approval
                finishes it.
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <form action={managerApproveAction}>
                <input type="hidden" name="requestId" value={request.id} />
                <button
                  type="submit"
                  className="rounded bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Approve
                </button>
              </form>

              <form
                action={managerRejectAction}
                className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
              >
                <input type="hidden" name="requestId" value={request.id} />
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