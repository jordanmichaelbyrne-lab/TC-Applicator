"use client";

import { useEffect, useMemo, useState } from "react";
import {
  saveCostAnalysisSnapshotAction,
  listCostAnalysisSnapshotsAction,
} from "./actions";
import type { CostAnalysisSnapshot } from "@/app/lib/repositories/costAnalysis";

function formatCurrency(value: number, decimals = 2) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CostAnalysisForm() {
  const [tungstenPricePerKg, setTungstenPricePerKg] = useState(190);
  const [wireCostPerCm2, setWireCostPerCm2] = useState(0.014);
  const [labourRatePerHour, setLabourRatePerHour] = useState(35);
  const [depositRateGPerMin, setDepositRateGPerMin] = useState(25);
  const [travelSpeedCmPerMin, setTravelSpeedCmPerMin] = useState(18);

  const [rentalRatePerM2, setRentalRatePerM2] = useState(155);
  const [rentalAreaM2, setRentalAreaM2] = useState(200);

  const [electricityAnnualCost, setElectricityAnnualCost] = useState(46000);
  const [electricityAttributionPct, setElectricityAttributionPct] = useState(40);
  const [electricityHoursBasis, setElectricityHoursBasis] = useState(8);

  const [workingDaysPerYear, setWorkingDaysPerYear] = useState(245);
  const [hoursPerDay, setHoursPerDay] = useState(5);

  const [bufferPct, setBufferPct] = useState(5);
  const [notes, setNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [history, setHistory] = useState<CostAnalysisSnapshot[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    (async () => {
      const result = await listCostAnalysisSnapshotsAction();

      if (result.success) {
        setHistory(result.data);
      } else {
        setHistoryError(result.message);
      }

      setIsLoadingHistory(false);
    })();
  }, []);

  const calculations = useMemo(() => {
    const tungstenGramsPerCm2 =
      travelSpeedCmPerMin > 0 ? depositRateGPerMin / travelSpeedCmPerMin : 0;
    const tungstenCostPerCm2 = (tungstenPricePerKg / 1000) * tungstenGramsPerCm2;

    const labourCostPerCm2 =
      travelSpeedCmPerMin > 0
        ? labourRatePerHour / 60 / travelSpeedCmPerMin
        : 0;

    const baseCostPerCm2 = tungstenCostPerCm2 + wireCostPerCm2 + labourCostPerCm2;

    const annualRental = rentalRatePerM2 * rentalAreaM2;
    const rentalCostPerCm2 =
      workingDaysPerYear > 0 && hoursPerDay > 0 && travelSpeedCmPerMin > 0
        ? annualRental / workingDaysPerYear / hoursPerDay / 60 / travelSpeedCmPerMin
        : 0;

    const attributedElectricity =
      electricityAnnualCost * (electricityAttributionPct / 100);
    const electricityCostPerCm2 =
      workingDaysPerYear > 0 &&
      electricityHoursBasis > 0 &&
      travelSpeedCmPerMin > 0
        ? attributedElectricity /
          workingDaysPerYear /
          electricityHoursBasis /
          60 /
          travelSpeedCmPerMin
        : 0;

    const trueCostPerCm2 = baseCostPerCm2 + rentalCostPerCm2 + electricityCostPerCm2;
    const bufferedSalesCostPerCm2 = trueCostPerCm2 * (1 + bufferPct / 100);

    return {
      tungstenCostPerCm2,
      labourCostPerCm2,
      baseCostPerCm2,
      rentalCostPerCm2,
      electricityCostPerCm2,
      trueCostPerCm2,
      bufferedSalesCostPerCm2,
    };
  }, [
    tungstenPricePerKg,
    wireCostPerCm2,
    labourRatePerHour,
    depositRateGPerMin,
    travelSpeedCmPerMin,
    rentalRatePerM2,
    rentalAreaM2,
    electricityAnnualCost,
    electricityAttributionPct,
    electricityHoursBasis,
    workingDaysPerYear,
    hoursPerDay,
    bufferPct,
  ]);

  async function handleSave() {
    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");

    const result = await saveCostAnalysisSnapshotAction({
      tungstenPricePerKg,
      wireCostPerCm2,
      labourRatePerHour,
      depositRateGPerMin,
      travelSpeedCmPerMin,
      rentalRatePerM2,
      rentalAreaM2,
      electricityAnnualCost,
      electricityAttributionPct,
      electricityHoursBasis,
      workingDaysPerYear,
      hoursPerDay,
      bufferPct,
      notes,
    });

    setIsSaving(false);

    if (!result.success) {
      setSaveError(result.message);
      return;
    }

    setSaveMessage("Snapshot saved.");
    setHistory((current) => [result.data, ...current]);
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-semibold">Process</h3>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <NumberField
                label="Tungsten price"
                value={tungstenPricePerKg}
                onChange={setTungstenPricePerKg}
                suffix="/ kg"
              />
              <NumberField
                label="Wire cost"
                value={wireCostPerCm2}
                onChange={setWireCostPerCm2}
                suffix="/ cm²"
                step={0.001}
              />
              <NumberField
                label="Labour rate"
                value={labourRatePerHour}
                onChange={setLabourRatePerHour}
                suffix="/ hr"
              />
              <NumberField
                label="Robot deposit rate"
                value={depositRateGPerMin}
                onChange={setDepositRateGPerMin}
                suffix="g / min"
              />
              <NumberField
                label="Robot travel speed"
                value={travelSpeedCmPerMin}
                onChange={setTravelSpeedCmPerMin}
                suffix="cm / min"
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-semibold">Rental</h3>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <NumberField
                label="Rental rate"
                value={rentalRatePerM2}
                onChange={setRentalRatePerM2}
                suffix="/ m² / yr"
              />
              <NumberField
                label="Facility area"
                value={rentalAreaM2}
                onChange={setRentalAreaM2}
                suffix="m²"
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-semibold">Electricity</h3>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <NumberField
                label="Annual electricity bill"
                value={electricityAnnualCost}
                onChange={setElectricityAnnualCost}
                suffix="/ yr"
              />
              <NumberField
                label="Attributable to robot"
                value={electricityAttributionPct}
                onChange={setElectricityAttributionPct}
                suffix="%"
              />
              <NumberField
                label="Hours basis"
                value={electricityHoursBasis}
                onChange={setElectricityHoursBasis}
                suffix="hrs / day"
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-semibold">Working time & buffer</h3>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <NumberField
                label="Working days"
                value={workingDaysPerYear}
                onChange={setWorkingDaysPerYear}
                suffix="/ yr"
              />
              <NumberField
                label="Robot hours"
                value={hoursPerDay}
                onChange={setHoursPerDay}
                suffix="/ day"
              />
              <NumberField
                label="Sales buffer"
                value={bufferPct}
                onChange={setBufferPct}
                suffix="%"
              />
            </div>

            <div className="border-t border-slate-200 p-5">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Notes (optional)
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="What changed since the last snapshot?"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-lg border border-slate-300 bg-white shadow-sm lg:sticky lg:top-5">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold">Result</h3>
          </div>

          <div className="space-y-3 px-5 pb-5 text-sm">
            <BreakdownRow
              label="Tungsten"
              value={formatCurrency(calculations.tungstenCostPerCm2, 3)}
            />
            <BreakdownRow
              label="Wire"
              value={formatCurrency(wireCostPerCm2, 3)}
            />
            <BreakdownRow
              label="Labour"
              value={formatCurrency(calculations.labourCostPerCm2, 3)}
            />
            <BreakdownRow
              label="Rental"
              value={formatCurrency(calculations.rentalCostPerCm2, 3)}
            />
            <BreakdownRow
              label="Electricity"
              value={formatCurrency(calculations.electricityCostPerCm2, 3)}
            />

            <div className="border-t border-slate-200 pt-3">
              <BreakdownRow
                label="True cost / cm²"
                value={formatCurrency(calculations.trueCostPerCm2, 3)}
                emphasised
              />
            </div>

            <div className="rounded-md border-2 border-slate-900 bg-slate-50 p-4 text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Buffered sales-reference cost
              </div>
              <div className="mt-1 text-2xl font-bold">
                {formatCurrency(calculations.bufferedSalesCostPerCm2, 3)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                per cm² · +{bufferPct}% buffer
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Snapshot"}
            </button>

            {saveMessage && (
              <p className="text-center text-sm text-emerald-700">{saveMessage}</p>
            )}
            {saveError && (
              <p className="text-center text-sm text-red-700">{saveError}</p>
            )}
          </div>
        </aside>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold">History</h3>
          <p className="mt-1 text-sm text-slate-500">
            Saved snapshots, most recent first.
          </p>
        </div>

        <div className="overflow-x-auto">
          {isLoadingHistory && (
            <p className="p-5 text-sm text-slate-500">Loading history…</p>
          )}

          {historyError && (
            <p className="p-5 text-sm text-red-700">{historyError}</p>
          )}

          {!isLoadingHistory && !historyError && (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Saved
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    True Cost
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Sales Reference
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {history.map((snapshot) => (
                  <tr key={snapshot.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      {formatDate(snapshot.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-medium">
                      {formatCurrency(snapshot.true_cost_per_cm2, 3)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-medium">
                      {formatCurrency(snapshot.buffered_sales_cost_per_cm2, 3)}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {snapshot.notes || "—"}
                    </td>
                  </tr>
                ))}

                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No snapshots saved yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
};

function NumberField({ label, value, onChange, suffix, step = 1 }: NumberFieldProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function commit(raw: string) {
    const parsed = Number(raw);
    onChange(Number.isFinite(parsed) && raw.trim() !== "" ? parsed : 0);
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="flex">
        <input
          type="number"
          step={step}
          value={text}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            if (raw.trim() !== "" && Number.isFinite(Number(raw))) {
              onChange(Number(raw));
            }
          }}
          onBlur={(event) => commit(event.target.value)}
          className={
            suffix
              ? "min-w-0 flex-1 rounded-l border border-slate-300 px-3 py-2"
              : "min-w-0 flex-1 rounded border border-slate-300 px-3 py-2"
          }
        />
        {suffix && (
          <span className="flex items-center rounded-r border border-l-0 border-slate-300 bg-slate-50 px-3 text-xs text-slate-600">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

type BreakdownRowProps = {
  label: string;
  value: string;
  emphasised?: boolean;
};

function BreakdownRow({ label, value, emphasised = false }: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={emphasised ? "font-semibold" : "text-slate-600"}>
        {label}
      </span>
      <span className={emphasised ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}