import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { updateProfileAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function ProfileSettingsPage({ searchParams }: PageProps) {
  const { error, success } = await searchParams;
  const { fullName, companyName, user } = await getCurrentUserAndCompany();

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

      <section className="rounded-md border border-slate-300 bg-white p-6">
        <h2 className="mb-4 font-semibold">Your Profile</h2>

        <form action={updateProfileAction} className="space-y-4">
          <label className="block max-w-sm">
            <span className="mb-1 block text-sm font-medium">Full name</span>
            <input
              name="fullName"
              defaultValue={fullName ?? ""}
              required
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <div className="max-w-sm text-sm text-slate-500">
            <p>
              <span className="font-medium text-slate-700">Email:</span>{" "}
              {user.email}
            </p>
            <p className="mt-1">
              <span className="font-medium text-slate-700">Company:</span>{" "}
              {companyName || "—"}
            </p>
          </div>

          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save
          </button>
        </form>
      </section>
    </div>
  );
}