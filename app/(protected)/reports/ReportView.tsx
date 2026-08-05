"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReportData, ReportEstimateRow } from "@/app/lib/repositories/reports";

type GroupBy = "none" | "customer" | "manufacturer" | "part" | "user" | "month";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function formatWeight(grams: number) {
  return grams >= 1000
    ? `${(grams / 1000).toFixed(2)} kg`
    : `${grams.toFixed(0)} g`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function monthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toCsv(rows: ReportEstimateRow[]) {
  const headers = [
    "Approved",
    "OEM Part",
    "Manufacturer",
    "Edge Profile",
    "Customer",
    "Created By",
    "Area (cm²)",
    "Carbide Weight",
    "Sell Price",
    "True Cost",
    "Margin",
  ];

  const lines = rows.map((row) =>
    [
      formatDate(row.approved_at),
      row.oem_part_number,
      row.manufacturer ?? "",
      row.edge_profile,
      row.customer_name ?? "",
      row.created_by_name ?? "",
      row.total_area_cm2.toFixed(0),
      row.carbide_weight_g !== null ? row.carbide_weight_g.toFixed(1) : "",
      row.total_sell_price.toFixed(2),
      row.true_cost !== null ? row.true_cost.toFixed(2) : "",
      row.margin !== null ? row.margin.toFixed(2) : "",
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...lines].join("\n");
}

type ReportViewProps = {
  fetchData: () => Promise<
    { success: true; data: ReportData } | { success: false; message: string }
  >;
};

export default function ReportView({ fetchData }: ReportViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rows, setRows] = useState<ReportEstimateRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<ReportData["filterOptions"]>({
    users: [],
    manufacturers: [],
    edgeProfiles: [],
  });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userId, setUserId] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [edgeProfile, setEdgeProfile] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  useEffect(() => {
    (async () => {
      const result = await fetchData();

      if (!result.success) {
        setLoadError(result.message);
        setIsLoading(false);
        return;
      }

      setRows(result.data.rows);
      setFilterOptions(result.data.filterOptions);
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (startDate && row.approved_at < startDate) return false;
      if (endDate && row.approved_at > `${endDate}T23:59:59`) return false;
      if (userId && row.created_by !== userId) return false;
      if (manufacturer && row.manufacturer !== manufacturer) return false;
      if (edgeProfile && row.edge_profile !== edgeProfile) return false;
      return true;
    });
  }, [rows, startDate, endDate, userId, manufacturer, edgeProfile]);

  const summary = useMemo(() => {
    let revenue = 0;
    let trueCost = 0;
    let costKnownCount = 0;
    let weightG = 0;
    let areaCm2 = 0;

    for (const row of filteredRows) {
      revenue += row.total_sell_price;
      areaCm2 += row.total_area_cm2;
      if (row.true_cost !== null) {
        trueCost += row.true_cost;
        costKnownCount += 1;
      }
      if (row.carbide_weight_g !== null) {
        weightG += row.carbide_weight_g;
      }
    }

    const margin = trueCost > 0 || costKnownCount > 0 ? revenue - trueCost : null;
    const marginPct = revenue > 0 && margin !== null ? (margin / revenue) * 100 : null;

    return {
      jobCount: filteredRows.length,
      costKnownCount,
      revenue,
      trueCost,
      margin,
      marginPct,
      weightG,
      areaCm2,
    };
  }, [filteredRows]);

  const groupedRows = useMemo(() => {
    if (groupBy === "none") return null;

    const groups = new Map<
      string,
      { label: string; revenue: number; trueCost: number; margin: number; count: number; weightG: number }
    >();

    for (const row of filteredRows) {
      let key: string;
      let label: string;

      switch (groupBy) {
        case "customer":
          key = row.customer_name || "—";
          label = key;
          break;
        case "manufacturer":
          key = row.manufacturer || "—";
          label = key;
          break;
        case "part":
          key = row.oem_part_number;
          label = key;
          break;
        case "user":
          key = row.created_by_name || "—";
          label = key;
          break;
        case "month":
          key = monthKey(row.approved_at);
          label = key;
          break;
        default:
          key = "—";
          label = "—";
      }

      const existing = groups.get(key) ?? {
        label,
        revenue: 0,
        trueCost: 0,
        margin: 0,
        count: 0,
        weightG: 0,
      };

      existing.revenue += row.total_sell_price;
      existing.count += 1;
      if (row.true_cost !== null) {
        existing.trueCost += row.true_cost;
        existing.margin += row.margin ?? 0;
      }
      if (row.carbide_weight_g !== null) {
        existing.weightG += row.carbide_weight_g;
      }

      groups.set(key, existing);
    }

    return Array.from(groups.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredRows, groupBy]);

  function handleExportCsv() {
    const csv = toCsv(filteredRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading report data…</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-700">{loadError}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="print-hidden rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">User</span>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {filterOptions.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Manufacturer</span>
            <select
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {filterOptions.manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Edge Profile</span>
            <select
              value={edgeProfile}
              onChange={(e) => setEdgeProfile(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {filterOptions.edgeProfiles.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Group by</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="none">No grouping</option>
              <option value="customer">Customer</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="part">OEM Part</option>
              <option value="user">User</option>
              <option value="month">Month</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Print / PDF
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Jobs" value={String(summary.jobCount)} />
        <SummaryCard label="Total Area" value={`${summary.areaCm2.toFixed(0)} cm²`} />
        <SummaryCard label="Carbide Weight" value={formatWeight(summary.weightG)} />
        <SummaryCard label="Revenue" value={formatCurrency(summary.revenue)} />
        <SummaryCard
          label="True Cost"
          value={formatCurrency(summary.trueCost)}
          helper={
            summary.costKnownCount < summary.jobCount
              ? `${summary.jobCount - summary.costKnownCount} job(s) missing cost data`
              : undefined
          }
        />
        <SummaryCard
          label="Margin"
          value={summary.margin !== null ? formatCurrency(summary.margin) : "—"}
          helper={summary.marginPct !== null ? `${summary.marginPct.toFixed(1)}%` : undefined}
          emphasised
        />
      </section>

      {groupedRows ? (
        <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Group</Th>
                  <Th>Jobs</Th>
                  <Th>Weight</Th>
                  <Th>Revenue</Th>
                  <Th>True Cost</Th>
                  <Th>Margin</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {groupedRows.map((group) => (
                  <tr key={group.label}>
                    <td className="px-4 py-2 font-medium">{group.label}</td>
                    <td className="px-4 py-2">{group.count}</td>
                    <td className="px-4 py-2">{formatWeight(group.weightG)}</td>
                    <td className="px-4 py-2">{formatCurrency(group.revenue)}</td>
                    <td className="px-4 py-2">{formatCurrency(group.trueCost)}</td>
                    <td className="px-4 py-2 font-medium">
                      {formatCurrency(group.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Approved</Th>
                  <Th>OEM Part</Th>
                  <Th>Manufacturer</Th>
                  <Th>Profile</Th>
                  <Th>Customer</Th>
                  <Th>User</Th>
                  <Th>Weight</Th>
                  <Th>Revenue</Th>
                  <Th>True Cost</Th>
                  <Th>Margin</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      {formatDate(row.approved_at)}
                    </td>
                    <td className="px-4 py-2 font-medium">{row.oem_part_number}</td>
                    <td className="px-4 py-2">{row.manufacturer || "—"}</td>
                    <td className="px-4 py-2">{row.edge_profile}</td>
                    <td className="px-4 py-2">{row.customer_name || "—"}</td>
                    <td className="px-4 py-2">{row.created_by_name || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {row.carbide_weight_g !== null
                        ? formatWeight(row.carbide_weight_g)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {formatCurrency(row.total_sell_price)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {row.true_cost !== null ? formatCurrency(row.true_cost) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-medium">
                      {row.margin !== null ? formatCurrency(row.margin) : "—"}
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                      No approved jobs match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <style jsx global>{`
        @media print {
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  emphasised = false,
}: {
  label: string;
  value: string;
  helper?: string;
  emphasised?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={emphasised ? "mt-1 text-xl font-bold" : "mt-1 text-xl font-semibold"}>
        {value}
      </div>
      {helper && <div className="mt-0.5 text-xs text-slate-500">{helper}</div>}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}