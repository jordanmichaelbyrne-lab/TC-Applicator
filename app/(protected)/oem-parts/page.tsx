import Link from "next/link";
import { getOemParts } from "@/app/lib/repositories/oemParts";
import OemPartsBrowser from "./OemPartsBrowser";

type OemPartsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function OemPartsPage({
  searchParams,
}: OemPartsPageProps) {
  const { error, success } = await searchParams;

  // Fetched once on the server; the browser filters live client-side
  // as the user types, instead of a full-page reload per search.
  const parts = await getOemParts();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">
              TC Applicator
            </h1>

            <p className="text-sm text-slate-500">
              OEM coating calculator database
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/estimates/new"
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Calculator
            </Link>

            <Link
              href="/oem-parts/new"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add OEM Part
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div>
          <h2 className="text-2xl font-semibold">
            OEM Parts
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Shared cutting-edge dimensions and standard coating patterns.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <OemPartsBrowser initialParts={parts} />
      </div>
    </main>
  );
}