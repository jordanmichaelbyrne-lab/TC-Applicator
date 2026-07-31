import Link from "next/link";
import {
  getOemParts,
  searchOemParts,
} from "@/app/lib/repositories/oemParts";
import { deleteOemPartAction } from "./actions";

type OemPartsPageProps = {
  searchParams: Promise<{
    q?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function OemPartsPage({
  searchParams,
}: OemPartsPageProps) {
  const { q = "", error, success } = await searchParams;

  const parts = q.trim()
    ? await searchOemParts(q)
    : await getOemParts();

  const verifiedCount = parts.filter(
    (part) => part.engineeringStatus === "Verified"
  ).length;

  const pendingCount = parts.filter(
    (part) =>
      part.engineeringStatus === "Pending Verification"
  ).length;

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

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label={q ? "Matching Parts" : "Total OEM Parts"}
            value={parts.length}
          />

          <SummaryCard
            label="Verified"
            value={verifiedCount}
          />

          <SummaryCard
            label="Pending Verification"
            value={pendingCount}
          />
        </div>

        <section className="mt-6 rounded-md border border-slate-300 bg-white">
          <form
            action="/oem-parts"
            className="flex flex-col gap-3 border-b border-slate-300 p-5 sm:flex-row"
          >
            <input
              name="q"
              defaultValue={q}
              className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2"
              placeholder="Search OEM number, manufacturer, description or profile"
            />

            <button
              type="submit"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Search
            </button>

            {q && (
              <Link
                href="/oem-parts"
                className="rounded border border-slate-300 px-4 py-2 text-center text-sm font-medium hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>OEM Part</TableHeading>
                  <TableHeading>Description</TableHeading>
                  <TableHeading>Manufacturer</TableHeading>
                  <TableHeading>Dimensions</TableHeading>
                  <TableHeading>Pattern</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Actions</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {parts.map((part) => (
                  <tr
                    key={part.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="font-semibold">
                        {part.oemPartNumber}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {part.profileFamily}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm">
                      <div className="font-medium">
                        {part.description}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {part.partCategory}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      {part.manufacturer}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      <div>
                        {part.lengthMm} × {part.widthMm} ×{" "}
                        {part.thicknessMm} mm
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {part.holeCount} holes · Ø
                        {part.holeDiameterMm} mm
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      <div>
                        Bevel:{" "}
                        {
                          part.standardPattern
                            .bevelRunsPerSide
                        }
                      </div>

                      <div className="text-xs text-slate-500">
                        Leading:{" "}
                        {
                          part.standardPattern
                            .leadingEdgeRunsPerSide
                        }{" "}
                        · Bottom:{" "}
                        {
                          part.standardPattern
                            .bottomFaceRunsPerSide
                        }
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge
                        status={part.engineeringStatus}
                      />
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/oem-parts/${part.id}`}
                          className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                          View
                        </Link>

                        <form action={deleteOemPartAction}>
                          <input
                            type="hidden"
                            name="partId"
                            value={part.id}
                          />

                          <button
                            type="submit"
                            className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}

                {parts.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      No OEM parts found. Add your first part to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
    >
      {children}
    </th>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-slate-300 bg-white p-5">
      <div className="text-sm text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-3xl font-semibold">
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const classes =
    status === "Verified"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : status === "Pending Verification"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-slate-300 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}