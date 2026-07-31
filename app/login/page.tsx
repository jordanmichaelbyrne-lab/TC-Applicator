import { redirect } from "next/navigation";
import { login } from "./actions";
import { createClient } from "@/app/lib/supabase/server";
import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-900">
      <div className="w-full max-w-sm rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">
            TC Applicator
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Sign in to access the coating calculator.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <form action={login} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Email
            </span>

            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Password
            </span>

            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Need access?{" "}
          <Link href="/signup" className="font-medium text-slate-900 underline">
            Request an account
          </Link>
        </p>
      </div>
    </main>
  );
}