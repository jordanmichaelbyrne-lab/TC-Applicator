import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { listOwnCompanyMembers } from "@/app/lib/repositories/userSettings";
import {
  setTeamMemberAdminAction,
  removeTeamMemberAction,
} from "../actions";

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function TeamSettingsPage({ searchParams }: PageProps) {
  const { error, success } = await searchParams;
  const { isAdmin, user } = await getCurrentUserAndCompany();
  const members = await listOwnCompanyMembers();

  return (
    <div className="space-y-6">
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

      <section className="rounded-md border border-slate-300 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold">Team</h2>
          <p className="mt-1 text-sm text-slate-600">
            Everyone with an account at your company.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {members.map((member) => {
            const isSelf = member.id === user.id;

            return (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div>
                  <div className="text-sm font-medium">
                    {member.full_name || "—"}
                    {isSelf && (
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        (you)
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {member.email || "—"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      member.is_admin
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                    }`}
                  >
                    {member.is_admin ? "Admin" : "Member"}
                  </span>

                  {isAdmin && (
                    <>
                      <form action={setTeamMemberAdminAction}>
                        <input type="hidden" name="memberId" value={member.id} />
                        <input
                          type="hidden"
                          name="makeAdmin"
                          value={member.is_admin ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                          {member.is_admin ? "Remove admin" : "Make admin"}
                        </button>
                      </form>

                      {!isSelf && (
                        <form action={removeTeamMemberAction}>
                          <input type="hidden" name="memberId" value={member.id} />
                          <button
                            type="submit"
                            className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No team members found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}