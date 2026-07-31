import Link from "next/link";
import { signup } from "./actions";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-900">
      <div className="w-full max-w-sm rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">TC Applicator</h1>
          <p className="mt-1 text-sm text-slate-600">
            Request access. Your account is reviewed by TC Applicator
            Support and your company&apos;s managers before you can sign in.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <form action={signup} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Full name</span>
            <input
              name="fullName"
              required
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Company you work for
            </span>
            <input
              name="companyName"
              required
              placeholder="e.g. ITR Pacific"
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
          >
            Request Access
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already approved?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}