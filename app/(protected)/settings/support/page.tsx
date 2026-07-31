import { submitSupportAction } from "../actions";

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function SupportRequestPage({ searchParams }: PageProps) {
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
        <h2 className="mb-1 font-semibold">Contact TC Applicator Support</h2>
        <p className="mb-4 text-sm text-slate-600">
          Sent directly to TC Applicator Support — you&apos;ll be contacted at
          your account email.
        </p>

        <form action={submitSupportAction} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Subject</span>
            <input
              name="subject"
              required
              placeholder="What's this about?"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Message</span>
            <textarea
              name="message"
              required
              rows={6}
              placeholder="Describe the issue or question…"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>

          <button
            type="submit"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Send Request
          </button>
        </form>
      </section>
    </div>
  );
}