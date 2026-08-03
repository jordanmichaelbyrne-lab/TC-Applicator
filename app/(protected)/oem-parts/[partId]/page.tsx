"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getOemPartAction,
  updateOemPartAction,
  deleteOemPartAction,
} from "@/app/(protected)/oem-parts/actions";
import type {
  EngineeringStatus,
  StandardCoatingPattern,
} from "@/app/types/oem-parts";

const PROFILE_FAMILIES = [
  "Reverse Double Bevel",
  "Dozer End Bit",
  "Scraper Router Bit",
  "Grader Blade",
];

const PART_CATEGORIES = [
  "Loader Centre Edge",
  "Dozer Centre Edge",
  "Dozer Outer Edge",
  "Scraper Centre Edge",
  "Excavator Edge",
  "Dozer End Bit",
  "Scraper Router Bit",
  "Grader Blade",
];

type FormPartState = {
  oemPartNumber: string;
  manufacturer: string;
  description: string;
  partCategory: string;
  profileFamily: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  holeCount: number;
  holeDiameterMm: number;
  holeRows: 1 | 2;
  compatibleMachines: string[];
  standardPattern: StandardCoatingPattern;
  engineeringStatus: EngineeringStatus;
  conditionRequirement: string;
  notes?: string;
};

export default function OemPartDetailPage() {
  const params = useParams<{ partId: string }>();
  const router = useRouter();
  const partId = decodeURIComponent(params.partId);

  const [isLoaded, setIsLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formPart, setFormPart] = useState<FormPartState | null>(null);
  const [savedPart, setSavedPart] = useState<FormPartState | null>(null);
  const [machinesText, setMachinesText] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await getOemPartAction(partId);

      if (cancelled) return;

      if (!result.success || !result.part) {
        setNotFound(true);
        setIsLoaded(true);
        return;
      }

      const part = result.part;
      const loaded: FormPartState = {
        oemPartNumber: part.oemPartNumber,
        manufacturer: part.manufacturer,
        description: part.description,
        partCategory: part.partCategory,
        profileFamily: part.profileFamily,
        lengthMm: part.lengthMm,
        widthMm: part.widthMm,
        thicknessMm: part.thicknessMm,
        holeCount: part.holeCount,
        holeDiameterMm: part.holeDiameterMm,
        holeRows: part.holeRows === 2 ? 2 : 1,
        compatibleMachines: part.compatibleMachines,
        standardPattern: part.standardPattern,
        engineeringStatus: part.engineeringStatus,
        conditionRequirement: part.conditionRequirement,
        notes: part.notes,
      };

      setFormPart(loaded);
      setSavedPart(loaded);
      setMachinesText(part.compatibleMachines.join("\n"));
      setIsLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [partId]);

  function updateField<K extends keyof FormPartState>(
    key: K,
    value: FormPartState[K]
  ) {
    setFormPart((current) =>
      current ? { ...current, [key]: value } : current
    );
  }

  function updatePattern(
    key: keyof StandardCoatingPattern,
    value: number
  ) {
    setFormPart((current) =>
      current
        ? {
            ...current,
            standardPattern: { ...current.standardPattern, [key]: value },
          }
        : current
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formPart) return;

    if (
      !formPart.oemPartNumber.trim() ||
      !formPart.manufacturer.trim() ||
      !formPart.description.trim()
    ) {
      setErrorMessage(
        "OEM part number, manufacturer and description are required."
      );
      return;
    }

    if (
      formPart.lengthMm <= 0 ||
      formPart.widthMm <= 0 ||
      formPart.thicknessMm <= 0
    ) {
      setErrorMessage("Length, width and thickness must be greater than zero.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const result = await updateOemPartAction(partId, {
      oemPartNumber: formPart.oemPartNumber.trim(),
      manufacturer: formPart.manufacturer.trim(),
      description: formPart.description.trim(),
      partCategory: formPart.partCategory,
      profileFamily: formPart.profileFamily,
      lengthMm: formPart.lengthMm,
      widthMm: formPart.widthMm,
      thicknessMm: formPart.thicknessMm,
      holeCount: formPart.holeCount,
      holeDiameterMm: formPart.holeDiameterMm,
      holeRows: formPart.holeRows,
      compatibleMachines: machinesText
        .split(/[\n,]/)
        .map((m) => m.trim())
        .filter(Boolean),
      standardPattern: formPart.standardPattern,
      engineeringStatus: formPart.engineeringStatus,
      conditionRequirement: "New OEM Specification Only",
      notes: formPart.notes?.trim() || undefined,
    });

    setIsSaving(false);

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    setSavedPart(formPart);
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!formPart) return;

    const confirmed = window.confirm(
      `Delete OEM part ${formPart.oemPartNumber}?`
    );
    if (!confirmed) return;

    setIsDeleting(true);

    const formData = new FormData();
    formData.set("partId", partId);
    await deleteOemPartAction(formData);
    setIsDeleting(false);
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
        Loading OEM record...
      </main>
    );
  }

  if (notFound || !formPart) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded border border-slate-300 bg-white p-8 text-center">
            <h1 className="text-xl font-semibold">OEM part not found</h1>
            <p className="mt-2 text-sm text-slate-600">
              This record may have been deleted or the link is invalid.
            </p>
            <Link
              href="/oem-parts"
              className="mt-6 inline-block rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Back to OEM Parts
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">TC Applicator</h1>
            <p className="text-sm text-slate-500">OEM engineering record</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/oem-parts"
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back to OEM Parts
            </Link>

            <Link
              href={`/estimates/new?oemPartId=${encodeURIComponent(partId)}`}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create Estimate
            </Link>
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold">{formPart.oemPartNumber}</h2>
              <StatusBadge status={formPart.engineeringStatus} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {formPart.manufacturer} · {formPart.description}
            </p>
          </div>

          <div className="flex gap-3">
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Edit Part
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </>
            )}

            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (savedPart) {
                      setFormPart(savedPart);
                      setMachinesText(savedPart.compatibleMachines.join("\n"));
                    }
                    setErrorMessage("");
                    setIsEditing(false);
                  }}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Part Identification">
            <div className="grid gap-4 md:grid-cols-2">
              <EditableTextField
                label="OEM Part Number"
                value={formPart.oemPartNumber}
                disabled={!isEditing}
                onChange={(v) => updateField("oemPartNumber", v)}
              />
              <EditableTextField
                label="Manufacturer"
                value={formPart.manufacturer}
                disabled={!isEditing}
                onChange={(v) => updateField("manufacturer", v)}
              />
              <div className="md:col-span-2">
                <EditableTextField
                  label="Description"
                  value={formPart.description}
                  disabled={!isEditing}
                  onChange={(v) => updateField("description", v)}
                />
              </div>
              <EditableSelectField
                label="Part Category"
                value={formPart.partCategory}
                disabled={!isEditing}
                options={PART_CATEGORIES}
                onChange={(v) => updateField("partCategory", v)}
              />
              <EditableSelectField
                label="Profile Family"
                value={formPart.profileFamily}
                disabled={!isEditing}
                options={PROFILE_FAMILIES}
                onChange={(v) => updateField("profileFamily", v)}
              />
            </div>
          </Section>

          <Section title="Engineering Control">
            <div className="grid gap-4 md:grid-cols-2">
              <EditableSelectField
                label="Engineering Status"
                value={formPart.engineeringStatus}
                disabled={!isEditing}
                options={["Draft", "Pending Verification", "Verified"]}
                onChange={(v) => updateField("engineeringStatus", v as EngineeringStatus)}
              />
              <ReadOnlyField
                label="Condition Requirement"
                value={formPart.conditionRequirement}
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium">Engineering Notes</span>
              <textarea
                value={formPart.notes ?? ""}
                disabled={!isEditing}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={5}
                className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-700"
              />
            </label>
          </Section>

          <Section title="OEM Dimensions">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <EditableNumberField
                label="Length"
                value={formPart.lengthMm}
                disabled={!isEditing}
                suffix="mm"
                onChange={(v) => updateField("lengthMm", v)}
              />
              <EditableNumberField
                label="Width"
                value={formPart.widthMm}
                disabled={!isEditing}
                suffix="mm"
                onChange={(v) => updateField("widthMm", v)}
              />
              <EditableNumberField
                label="Thickness"
                value={formPart.thicknessMm}
                disabled={!isEditing}
                suffix="mm"
                step={0.1}
                onChange={(v) => updateField("thicknessMm", v)}
              />
              <EditableNumberField
                label={formPart.holeRows === 2 ? "Bolt Holes (per row)" : "Bolt Holes"}
                value={formPart.holeCount}
                disabled={!isEditing}
                onChange={(v) => updateField("holeCount", v)}
              />
              <EditableNumberField
                label="Hole Diameter"
                value={formPart.holeDiameterMm}
                disabled={!isEditing}
                suffix="mm"
                step={0.1}
                onChange={(v) => updateField("holeDiameterMm", v)}
              />
            </div>

            <div className="mt-4 max-w-xs">
              <EditableSelectField
                label="Hole Rows"
                value={String(formPart.holeRows)}
                disabled={!isEditing}
                options={["1", "2"]}
                onChange={(v) => updateField("holeRows", v === "2" ? 2 : 1)}
              />
            </div>
          </Section>

          <Section title="Compatible Machines">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Machine Models</span>
              <textarea
                value={machinesText}
                disabled={!isEditing}
                onChange={(e) => setMachinesText(e.target.value)}
                rows={5}
                className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-700"
              />
            </label>
          </Section>

          <div className="lg:col-span-2">
            <Section title="Standard Coating Pattern">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <EditableNumberField
                  label="Bevel Runs per Side"
                  value={formPart.standardPattern.bevelRunsPerSide}
                  disabled={!isEditing}
                  onChange={(v) => updatePattern("bevelRunsPerSide", v)}
                />
                <EditableNumberField
                  label="Leading Edge Runs per Side"
                  value={formPart.standardPattern.leadingEdgeRunsPerSide}
                  disabled={!isEditing}
                  onChange={(v) => updatePattern("leadingEdgeRunsPerSide", v)}
                />
                <EditableNumberField
                  label="Bottom Face Runs per Side"
                  value={formPart.standardPattern.bottomFaceRunsPerSide}
                  disabled={!isEditing}
                  onChange={(v) => updatePattern("bottomFaceRunsPerSide", v)}
                />
                <EditableNumberField
                  label="Eyebrows per Hole"
                  value={formPart.standardPattern.eyebrowsPerHole}
                  disabled={!isEditing}
                  onChange={(v) => updatePattern("eyebrowsPerHole", v)}
                />
              </div>
            </Section>
          </div>
        </div>
      </form>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-300 bg-white">
      <div className="border-b border-slate-300 px-5 py-4">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EditableTextField({ label, value, disabled, onChange }: {
  label: string; value: string; disabled: boolean; onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-700"
      />
    </label>
  );
}

function EditableSelectField({ label, value, disabled, options, onChange }: {
  label: string; value: string; disabled: boolean; options: string[]; onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-700"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function EditableNumberField({ label, value, disabled, onChange, suffix, step = 1 }: {
  label: string; value: number; disabled: boolean; onChange: (value: number) => void; suffix?: string; step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="flex">
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={suffix
            ? "min-w-0 flex-1 rounded-l border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-700"
            : "min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-700"}
        />
        {suffix && (
          <span className="flex items-center rounded-r border border-l-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-600">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium">{label}</div>
      <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: EngineeringStatus }) {
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