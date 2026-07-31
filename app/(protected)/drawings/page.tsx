import Link from "next/link";
import { listApprovedEstimates } from "@/app/lib/repositories/estimates";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DrawingsPage() {
  const approved = await listApprovedEstimates();

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Approved Drawings</h2>
          <p className="mt-1 text-sm text-slate-600">
            Confirmed coating specs, visible to everyone at your company.
          </p>
        </div>

        <section className="rounded-md border border-slate-300 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeading>OEM Part</TableHeading>
                  <TableHeading>Customer / Job Ref</TableHeading>
                  <TableHeading>Description</TableHeading>
                  <TableHeading>Dimensions</TableHeading>
                  <TableHeading>Sell Price</TableHeading>
                  <TableHeading>Approved</TableHeading>
                  <TableHeading>Actions</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {approved.map((estimate) => (
                  <tr key={estimate.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="font-semibold">
                        {estimate.oem_part_number}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {estimate.edge_profile}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      <div>{estimate.customer_name || "—"}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {estimate.job_reference
                          ? `Pronto ${estimate.job_reference}`
                          : "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm">
                      <div className="font-medium">
                        {estimate.manufacturer || "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {estimate.edge_type || "—"}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      {estimate.length_mm} × {estimate.width_mm} ×{" "}
                      {estimate.thickness_mm} mm
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium">
                      {formatCurrency(estimate.total_sell_price)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {formatDate(estimate.approved_at)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        href={`/drawings/${estimate.id}`}
                        className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {approved.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      No approved drawings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
    </div>
  );
}

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
    >
      {children}
    </th>
  );
}