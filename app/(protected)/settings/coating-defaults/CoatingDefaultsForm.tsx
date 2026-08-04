"use client";

import { useState } from "react";
import {
  updateCompanySettings,
  type UpdateSettingsResult,
} from "@/app/lib/settings/actions";
import type { CompanySettings } from "@/app/lib/settings/companySettings";

type Props = {
  initialSettings: CompanySettings;
};

export default function CoatingDefaultsForm({ initialSettings }: Props) {
  const [carbideCostRate, setCarbideCostRate] = useState(
    String(initialSettings.carbide_cost_rate_per_cm2)
  );
  const [runWidth, setRunWidth] = useState(
    String(initialSettings.run_width_mm)
  );
  const [eyebrowLength, setEyebrowLength] = useState(
    String(initialSettings.eyebrow_length_mm)
  );
  const [holeRowSpacing, setHoleRowSpacing] = useState(
    String(initialSettings.hole_row_spacing_mm)
  );
  const [holeOffset, setHoleOffset] = useState(
    String(initialSettings.hole_offset_mm)
  );

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<UpdateSettingsResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResult(null);

    const response = await updateCompanySettings({
      carbideCostRatePerCm2: parseFloat(carbideCostRate),
      runWidthMm: parseFloat(runWidth),
      eyebrowLengthMm: parseFloat(eyebrowLength),
      holeRowSpacingMm: parseFloat(holeRowSpacing),
      holeOffsetMm: parseFloat(holeOffset),
    });

    setResult(response);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">
          Carbide cost rate ($/cm²)
        </label>
        <input
          type="number"
          step="0.0001"
          min="0"
          value={carbideCostRate}
          onChange={(e) => setCarbideCostRate(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Standard run width (mm)
        </label>
        <p className="text-xs text-gray-500 mb-1">
          Set once per job on the welding robot — this is the width applied
          to bevel, leading edge, bottom face, and eyebrow runs.
        </p>
        <input
          type="number"
          step="0.1"
          min="0"
          value={runWidth}
          onChange={(e) => setRunWidth(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Short eyebrow length (mm)
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={eyebrowLength}
          onChange={(e) => setEyebrowLength(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          2-row hole spacing (mm)
        </label>
        <p className="text-xs text-gray-500 mb-1">
          Standard distance between the two rows of bolt holes on
          double-row edges (e.g. scraper Stinger/End edges on machines
          like the CAT 637).
        </p>
        <input
          type="number"
          step="0.1"
          min="0"
          value={holeRowSpacing}
          onChange={(e) => setHoleRowSpacing(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Hole offset from edge (mm)
        </label>
        <p className="text-xs text-gray-500 mb-1">
          Standard distance the hole row sits from the top edge on
          offset-hole edges (e.g. flat grader blades, where the row sits
          away from the bevel side rather than centred).
        </p>
        <input
          type="number"
          step="0.1"
          min="0"
          value={holeOffset}
          onChange={(e) => setHoleOffset(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>

      {result && !result.success && (
        <p className="text-sm text-red-600">{result.error}</p>
      )}
      {result && result.success && (
        <p className="text-sm text-green-600">Saved.</p>
      )}
    </form>
  );
}