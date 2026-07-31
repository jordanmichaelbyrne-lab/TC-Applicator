import { getOwnNotificationPreference } from "@/app/lib/repositories/userSettings";
import { updateNotificationsAction } from "../actions";

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function NotificationSettingsPage({
  searchParams,
}: PageProps) {
  const { error, success } = await searchParams;
  const notifyByEmail = await getOwnNotificationPreference();

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
        <h2 className="mb-4 font-semibold">Email Notifications</h2>

        <p className="mb-4 text-sm text-slate-600">
          Applies to admin-relevant emails — new signup requests, approvals
          needing your review, and support requests, depending on your role.
        </p>

        <form action={updateNotificationsAction}>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="notifyByEmail"
              defaultChecked={notifyByEmail}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm">Send me email notifications</span>
          </label>

          <button
            type="submit"
            className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save
          </button>
        </form>
      </section>
    </div>
  );
}