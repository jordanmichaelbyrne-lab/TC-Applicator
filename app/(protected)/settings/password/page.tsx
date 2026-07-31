import { updatePasswordAction } from "../actions";

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function PasswordSettingsPage({ searchParams }: PageProps) {
  const { error, success } = await searchParams;

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
        <h2 className="mb-4 font-semibold">Change Password</h2>

        <form action={updatePasswordAction} className="max-w-sm space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              New password
            </span>
            <input
              type="password"
              name="newPassword"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Confirm new password
            </span>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Update Password
          </button>
        </form>
      </section>
    </div>
  );
}