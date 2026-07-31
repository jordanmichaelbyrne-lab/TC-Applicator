import Link from "next/link";

export default function SignupPendingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-900">
      <div className="w-full max-w-md rounded-lg border border-slate-300 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Request submitted</h1>

        <p className="mt-2 text-sm text-slate-600">
          Your account request has been sent to TC Applicator Support and
          your company&apos;s managers for approval. You&apos;ll be able to
          sign in once both have approved it.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-block rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to Sign In
        </Link>
      </div>
    </main>
  );
}