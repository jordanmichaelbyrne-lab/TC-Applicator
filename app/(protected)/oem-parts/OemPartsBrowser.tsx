"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteOemPartAction } from "./actions";
import type { mapOemPartRow } from "@/app/types/oem-parts";

type OemPart = ReturnType<typeof mapOemPartRow>;

type OemPartsBrowserProps = {
  initialParts: OemPart[];
};

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function partMatchesSearch(part: OemPart, searchTerm: string) {
  const term = normalise(searchTerm);
  if (!term) return true;

  const searchableValues = [
    part.oemPartNumber,
    part.manufacturer,
    part.description,
    part.profileFamily,
    part.partCategory,
  ];

  return searchableValues.some((value) => normalise(value).includes(term));
}

export default function OemPartsBrowser({ initialParts }: OemPartsBrowserProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchText, setSearchText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredParts = useMemo(
    () => initialParts.filter((part) => partMatchesSearch(part, searchText)),
    [initialParts, searchText]
  );

  const dropdownMatches = useMemo(() => filteredParts.slice(0, 8), [filteredParts]);

  const verifiedCount = filteredParts.filter(
    (part) => part.engineeringStatus === "Verified"
  ).length;
  const pendingCount = filteredParts.filter(
    (part) => part.engineeringStatus === "Pending Verification"
  ).length;

  function goToPart(partId: string) {
    setIsDropdownOpen(false);
    router.push(`/oem-parts/${partId}`);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isDropdownOpen || dropdownMatches.length === 0) {
      if (event.key === "Escape") {
        setSearchText("");
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        Math.min(current + 1, dropdownMatches.length - 1)
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const part = dropdownMatches[highlightedIndex];
      if (part) {
        goToPart(part.id);
      }
    }

    if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  }

  return (
    <div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label={searchText ? "Matching Parts" : "Total OEM Parts"}
          value={filteredParts.length}
        />
        <SummaryCard label="Verified" value={verifiedCount} />
        <SummaryCard label="Pending Verification" value={pendingCount} />
      </div>

      <section className="mt-6 rounded-md border border-slate-300 bg-white">
        <div className="relative border-b border-slate-300 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Search</span>
            <input
              ref={searchInputRef}
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setHighlightedIndex(0);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => {
                // Small delay so a click on a dropdown item registers
                // before the dropdown closes from the blur.
                window.setTimeout(() => setIsDropdownOpen(false), 150);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              placeholder="Search OEM number, manufacturer, description or profile"
              autoComplete="off"
            />
          </label>

          {isDropdownOpen && searchText.trim() && dropdownMatches.length > 0 && (
            <div className="absolute left-5 right-5 top-[72px] z-20 overflow-hidden rounded-md border border-slate-300 bg-white shadow-xl">
              {dropdownMatches.map((part, index) => (
                <button
                  key={part.id}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => goToPart(part.id)}
                  className={`flex w-full items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 text-left last:border-b-0 ${
                    index === highlightedIndex ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="font-semibold">{part.oemPartNumber}</div>
                    <div className="mt-0.5 text-sm text-slate-700">
                      {part.manufacturer} · {part.description}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-slate-500">
                    {part.lengthMm} × {part.widthMm} × {part.thicknessMm} mm
                  </div>
                </button>
              ))}

              {filteredParts.length > dropdownMatches.length && (
                <div className="border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500">
                  +{filteredParts.length - dropdownMatches.length} more match
                  {filteredParts.length - dropdownMatches.length === 1 ? "" : "es"} in
                  the table below
                </div>
              )}
            </div>
          )}
        </div>

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
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="font-semibold">{part.oemPartNumber}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {part.profileFamily}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    <div className="font-medium">{part.description}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {part.partCategory}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm">
                    {part.manufacturer}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm">
                    <div>
                      {part.lengthMm} × {part.widthMm} × {part.thicknessMm} mm
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {part.holeCount} holes · Ø{part.holeDiameterMm} mm
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm">
                    <div>Bevel: {part.standardPattern.bevelRunsPerSide}</div>
                    <div className="text-xs text-slate-500">
                      Leading: {part.standardPattern.leadingEdgeRunsPerSide} · Bottom:{" "}
                      {part.standardPattern.bottomFaceRunsPerSide}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <StatusBadge status={part.engineeringStatus} />
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
                        <input type="hidden" name="partId" value={part.id} />
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

              {filteredParts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                    {searchText
                      ? "No OEM parts match your search."
                      : "No OEM parts found. Add your first part to begin."}
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-300 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "Verified"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : status === "Pending Verification"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-slate-300 bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
}