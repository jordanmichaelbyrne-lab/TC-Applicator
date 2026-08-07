import { listApprovedEstimates } from "@/app/lib/repositories/estimates";
import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import DrawingsBrowser from "./DrawingsBrowser";

export default async function DrawingsPage() {
  const [{ estimates, users }, { user }] = await Promise.all([
    listApprovedEstimates(),
    getCurrentUserAndCompany(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Approved Drawings</h2>
          <p className="mt-1 text-sm text-slate-600">
            Confirmed coating specs, visible to everyone at your company.
            Filter by yourself at the end of the week to check off quotes
            as converted or lost.
          </p>
        </div>

        <DrawingsBrowser
          estimates={estimates}
          users={users}
          currentUserId={user.id}
        />
    </div>
  );
}