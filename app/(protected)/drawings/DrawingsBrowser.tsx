"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import QuoteOutcomeControl from "./QuoteOutcomeControl";
import type { EstimateRow, ApprovedEstimateUser } from "@/app/lib/repositories/estimates";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

type DrawingsBrowserProps = {
  estimates: EstimateRow[];
  users: ApprovedEstimateUser[];
  currentUserId: string;
};

type OutcomeFilter = "" | "pending" | "converted" | "lost";

export default function DrawingsBrowser({
  estimates,
  users,
  currentUserId,
}: DrawingsBrowserProps) {
  const [userFilter, setUserFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("");

  const filtered = useMemo(() => {
    return estimates.filter((estimate) => {
      if (userFilter && estimate.created_by !== userFilter) return false;
      if (outcomeFilter && estimate.quote_outcome !== outcomeFilter) return false;
      return true;
    });
  }, [estimates, userFilter, outcomeFilter]);

  const nameById = new Map(users.map((u) => [u.id, u.name]));
  const currentUserIsAnOption = users.some((u) => u.id === currentUserId);

  return (
    <>
      <section className="mb-5 flex flex-wrap items-end gap-4 rounded-md border border-slate-300 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Created by</span>
          <select
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Everyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>

        {currentUserIsAnOption && (
          <button
            type="button"
            onClick={() => setUserFilter(currentUserId)}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Just me
          </button>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Outcome</span>
          <select
            value={outcomeFilter}
            onChange={(event) => setOutcomeFilter(event.target.value as OutcomeFilter)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </label>

        {(userFilter || outcomeFilter) && (
          <button
            type="button"
            onClick={() => {
              setUserFilter("");
              setOutcomeFilter("");
            }}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}

        <span className="text-sm text-slate-500">
          {filtered.length} of {estimates.length}
        </span>
      </section>

      <section className="rounded-md border border-slate-300 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <TableHeading>OEM Part</TableHeading>
                <TableHeading>Customer / Job Ref</TableHeading>
                <TableHeading>Dimensions</TableHeading>
                <TableHeading>Sell Price</TableHeading>
                <TableHeading>Approved</TableHeading>
                <TableHeading>Outcome</TableHeading>
                <TableHeading>Actions</TableHeading>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((estimate) => (
                <tr key={estimate.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold">{estimate.oem_part_number}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {estimate.manufacturer || "—"} · {estimate.edge_type || estimate.edge_profile}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm">
                    <div>{estimate.customer_name || "—"}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {estimate.job_reference ? `Pronto ${estimate.job_reference}` : "—"}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm">
                    {estimate.length_mm} × {estimate.width_mm} × {estimate.thickness_mm} mm
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium">
                    {formatCurrency(estimate.total_sell_price)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    <div>{formatDate(estimate.approved_at)}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {estimate.created_by ? nameById.get(estimate.created_by) || "—" : "—"}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <QuoteOutcomeControl
                      estimateId={estimate.id}
                      initialOutcome={estimate.quote_outcome}
                      initialLostReason={estimate.quote_lost_reason}
                    />
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

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                    {estimates.length === 0
                      ? "No approved drawings yet."
                      : "No approved drawings match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
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