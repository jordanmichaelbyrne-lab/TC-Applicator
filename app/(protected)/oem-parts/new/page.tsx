"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  OemPart,
  PartCategory,
  ProfileFamily,
} from "@/app/data/oemParts";

const STORAGE_KEY = "tc-applicator-custom-oem-parts";

const PROFILE_FAMILIES: ProfileFamily[] = [
  "Reverse Double Bevel",
  "Dozer End Bit",
  "Scraper Router Bit",
  "Grader Blade",
];

const PART_CATEGORIES: PartCategory[] = [
  "Loader Centre Edge",
  "Dozer Centre Edge",
  "Dozer Outer Edge",
  "Scraper Centre Edge",
  "Excavator Edge",
  "Dozer End Bit",
  "Scraper Router Bit",
  "Grader Blade",
];

function createPartId(
  manufacturer: string,
  oemPartNumber: string
) {
  return `${manufacturer}-${oemPartNumber}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readStoredParts(): OemPart[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedValue = window.localStorage.getItem(STORAGE_KEY);

  if (!savedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(savedValue);

    return Array.isArray(parsedValue)
      ? (parsedValue as OemPart[])
      : [];
  } catch {
    return [];
  }
}

export default function NewOemPartPage() {
  const router = useRouter();

  const [oemPartNumber, setOemPartNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [description, setDescription] = useState("");

  const [profileFamily, setProfileFamily] =
    useState<ProfileFamily>("Reverse Double Bevel");

  const [partCategory, setPartCategory] =
    useState<PartCategory>("Loader Centre Edge");

  const [lengthMm, setLengthMm] = useState(0);
  const [widthMm, setWidthMm] = useState(0);
  const [thicknessMm, setThicknessMm] = useState(0);

  const [holeCount, setHoleCount] = useState(0);
  const [holeDiameterMm, setHoleDiameterMm] = useState(0);

  const [compatibleMachinesText, setCompatibleMachinesText] =
    useState("");

  const [bevelRunsPerSide, setBevelRunsPerSide] = useState(2);
  const [leadingEdgeRunsPerSide, setLeadingEdgeRunsPerSide] =
    useState(1);
  const [bottomFaceRunsPerSide, setBottomFaceRunsPerSide] =
    useState(2);
  const [eyebrowsPerHole, setEyebrowsPerHole] = useState(0);

  const [engineeringStatus, setEngineeringStatus] =
    useState<OemPart["engineeringStatus"]>(
      "Pending Verification"
    );

  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const compatibleMachines = useMemo(
    () =>
      compatibleMachinesText
        .split(/[\n,]/)
        .map((machine) => machine.trim())
        .filter(Boolean),
    [compatibleMachinesText]
  );

  const partPreview: OemPart = {
    id:
      createPartId(manufacturer, oemPartNumber) ||
      "new-oem-part",
    oemPartNumber: oemPartNumber.trim(),
    manufacturer: manufacturer.trim(),
    description: description.trim(),
    profileFamily,
    partCategory,
    lengthMm,
    widthMm,
    thicknessMm,
    holeCount,
    holeDiameterMm,
    compatibleMachines,
    standardPattern: {
      bevelRunsPerSide,
      leadingEdgeRunsPerSide,
      bottomFaceRunsPerSide,
      eyebrowsPerHole,
    },
    conditionRequirement: "New OEM Specification Only",
    engineeringStatus,
    notes: notes.trim() || undefined,
  };

  function validatePart() {
    if (!oemPartNumber.trim()) {
      return "Enter an OEM part number.";
    }

    if (!manufacturer.trim()) {
      return "Enter a manufacturer.";
    }

    if (!description.trim()) {
      return "Enter a part description.";
    }

    if (
      lengthMm <= 0 ||
      widthMm <= 0 ||
      thicknessMm <= 0
    ) {
      return "Length, width and thickness must be greater than zero.";
    }

    if (holeCount < 0 || holeDiameterMm < 0) {
      return "Hole values cannot be negative.";
    }

    return "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validatePart();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const storedParts = readStoredParts();

    const duplicatePart = storedParts.some(
      (part) =>
        part.oemPartNumber.toLowerCase() ===
          partPreview.oemPartNumber.toLowerCase() &&
        part.manufacturer.toLowerCase() ===
          partPreview.manufacturer.toLowerCase()
    );

    if (duplicatePart) {
      setErrorMessage(
        "A saved part with this manufacturer and OEM number already exists."
      );
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...storedParts, partPreview])
    );

    router.push("/oem-parts");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">
              TC Applicator
            </h1>

            <p className="text-sm text-slate-500">
              Add OEM engineering record
            </p>
          </div>

          <Link
            href="/oem-parts"
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to OEM Parts
          </Link>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-7xl px-6 py-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            Add OEM Part
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Create a new engineering record for a brand-new
            OEM-specification cutting edge.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Section title="Part Identification">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="OEM Part Number"
                  value={oemPartNumber}
                  onChange={setOemPartNumber}
                  placeholder="Example: 1099212"
                  required
                />

                <TextField
                  label="Manufacturer"
                  value={manufacturer}
                  onChange={setManufacturer}
                  placeholder="Example: Caterpillar"
                  required
                />

                <div className="md:col-span-2">
                  <TextField
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    placeholder="Example: Loader Centre Edge"
                    required
                  />
                </div>

                <SelectField
                  label="Part Category"
                  value={partCategory}
                  onChange={(value) =>
                    setPartCategory(value as PartCategory)
                  }
                  options={PART_CATEGORIES}
                />

                <SelectField
                  label="Profile Family"
                  value={profileFamily}
                  onChange={(value) =>
                    setProfileFamily(value as ProfileFamily)
                  }
                  options={PROFILE_FAMILIES}
                />
              </div>
            </Section>

            <Section title="OEM Dimensions">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <NumberField
                  label="Length"
                  value={lengthMm}
                  onChange={setLengthMm}
                  suffix="mm"
                />

                <NumberField
                  label="Width"
                  value={widthMm}
                  onChange={setWidthMm}
                  suffix="mm"
                />

                <NumberField
                  label="Thickness"
                  value={thicknessMm}
                  onChange={setThicknessMm}
                  suffix="mm"
                  step={0.1}
                />

                <NumberField
                  label="Bolt Holes"
                  value={holeCount}
                  onChange={setHoleCount}
                />

                <NumberField
                  label="Hole Diameter"
                  value={holeDiameterMm}
                  onChange={setHoleDiameterMm}
                  suffix="mm"
                  step={0.1}
                />
              </div>
            </Section>

            <Section title="Compatible Machines">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Machine Models
                </span>

                <textarea
                  value={compatibleMachinesText}
                  onChange={(event) =>
                    setCompatibleMachinesText(
                      event.target.value
                    )
                  }
                  rows={4}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  placeholder={
                    "Enter one model per line or separate with commas.\nExample:\nCAT 980\nCAT 980G\nCAT 980H"
                  }
                />
              </label>
            </Section>

            <Section title="Standard Coating Pattern">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <NumberField
                  label="Bevel Runs per Side"
                  value={bevelRunsPerSide}
                  onChange={setBevelRunsPerSide}
                />

                <NumberField
                  label="Leading Edge Runs per Side"
                  value={leadingEdgeRunsPerSide}
                  onChange={setLeadingEdgeRunsPerSide}
                />

                <NumberField
                  label="Bottom Face Runs per Side"
                  value={bottomFaceRunsPerSide}
                  onChange={setBottomFaceRunsPerSide}
                />

                <NumberField
                  label="Eyebrows per Hole"
                  value={eyebrowsPerHole}
                  onChange={setEyebrowsPerHole}
                />
              </div>
            </Section>

            <Section title="Engineering Control">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Engineering Status"
                  value={engineeringStatus}
                  onChange={(value) =>
                    setEngineeringStatus(
                      value as OemPart["engineeringStatus"]
                    )
                  }
                  options={[
                    "Draft",
                    "Pending Verification",
                    "Verified",
                  ]}
                />

                <ReadOnlyField
                  label="Condition Requirement"
                  value="New OEM Specification Only"
                />
              </div>

              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-medium">
                  Engineering Notes
                </span>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  rows={5}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  placeholder="Record measurement sources, drawing references or verification notes."
                />
              </label>
            </Section>
          </div>

          <aside className="h-fit rounded-md border border-slate-300 bg-white xl:sticky xl:top-6">
            <div className="border-b border-slate-300 px-5 py-4">
              <h3 className="font-semibold">
                Part Preview
              </h3>
            </div>

            <div className="space-y-4 p-5">
              <PreviewRow
                label="OEM Number"
                value={partPreview.oemPartNumber || "—"}
              />

              <PreviewRow
                label="Manufacturer"
                value={partPreview.manufacturer || "—"}
              />

              <PreviewRow
                label="Description"
                value={partPreview.description || "—"}
              />

              <PreviewRow
                label="Category"
                value={partPreview.partCategory}
              />

              <PreviewRow
                label="Profile"
                value={partPreview.profileFamily}
              />

              <PreviewRow
                label="Dimensions"
                value={`${lengthMm} × ${widthMm} × ${thicknessMm} mm`}
              />

              <PreviewRow
                label="Holes"
                value={`${holeCount} × Ø${holeDiameterMm} mm`}
              />

              <PreviewRow
                label="Machines"
                value={
                  compatibleMachines.length > 0
                    ? compatibleMachines.join(", ")
                    : "—"
                }
              />

              <div className="border-t border-slate-200 pt-4">
                <StatusBadge status={engineeringStatus} />
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm">
                <strong>Condition:</strong>
                <div className="mt-1">
                  New OEM Specification Only
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Save OEM Part
              </button>

              <Link
                href="/oem-parts"
                className="block w-full rounded border border-slate-300 px-4 py-2 text-center text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </aside>
        </div>
      </form>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-300 bg-white">
      <div className="border-b border-slate-300 px-5 py-4">
        <h3 className="font-semibold">{title}</h3>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="w-full rounded border border-slate-300 px-3 py-2"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded border border-slate-300 px-3 py-2"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
      </span>

      <div className="flex">
        <input
          type="number"
          min="0"
          step={step}
          value={value || ""}
          onChange={(event) =>
            onChange(Number(event.target.value) || 0)
          }
          className={
            suffix
              ? "min-w-0 flex-1 rounded-l border border-slate-300 px-3 py-2"
              : "min-w-0 flex-1 rounded border border-slate-300 px-3 py-2"
          }
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

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium">
        {label}
      </div>

      <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
        {value}
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium">
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: OemPart["engineeringStatus"];
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