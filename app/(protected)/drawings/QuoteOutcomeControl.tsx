"use client";

import { useState } from "react";
import { setQuoteOutcomeAction } from "@/app/(protected)/estimates/actions";

type Outcome = "pending" | "converted" | "lost";

type QuoteOutcomeControlProps = {
  estimateId: string;
  initialOutcome: Outcome;
  initialLostReason: string | null;
};

const OUTCOME_CLASSES: Record<Outcome, string> = {
  pending: "border-slate-300 bg-slate-100 text-slate-700",
  converted: "border-emerald-300 bg-emerald-50 text-emerald-800",
  lost: "border-red-300 bg-red-50 text-red-800",
};

export default function QuoteOutcomeControl({
  estimateId,
  initialOutcome,
  initialLostReason,
}: QuoteOutcomeControlProps) {
  const [outcome, setOutcome] = useState<Outcome>(initialOutcome);
  const [lostReason, setLostReason] = useState(initialLostReason ?? "");
  const [showLostReasonInput, setShowLostReasonInput] = useState(
    initialOutcome === "lost"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(nextOutcome: Outcome, reason?: string) {
    setIsSaving(true);
    setError("");

    const result = await setQuoteOutcomeAction(estimateId, nextOutcome, reason);

    setIsSaving(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setOutcome(nextOutcome);
  }

  function handleSelect(nextOutcome: Outcome) {
    if (nextOutcome === "lost") {
      // Don't save yet — wait for a reason (or an explicit skip) so
      // we're not saving "lost" with a blank reason on every click.
      setShowLostReasonInput(true);
      return;
    }

    setShowLostReasonInput(false);
    save(nextOutcome);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={outcome}
        onChange={(event) => handleSelect(event.target.value as Outcome)}
        disabled={isSaving}
        className={`w-32 rounded border px-2 py-1.5 text-xs font-semibold ${OUTCOME_CLASSES[outcome]}`}
      >
        <option value="pending">Pending</option>
        <option value="converted">Converted</option>
        <option value="lost">Lost</option>
      </select>

      {isSaving && <p className="text-xs text-slate-500">Saving…</p>}

      {showLostReasonInput && (
        <div className="flex items-center gap-1.5">
          <input
            value={lostReason}
            onChange={(event) => setLostReason(event.target.value)}
            placeholder="Reason (optional)"
            className="w-32 rounded border border-slate-300 px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => save("lost", lostReason)}
            disabled={isSaving}
            className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}