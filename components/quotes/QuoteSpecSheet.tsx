"use client";

import { useState } from "react";
import CoatingLayout from "@/components/drawing/CoatingLayout";

type EdgeProfile = "single-bevel" | "double-bevel" | "square-edge";

type QuoteSpecSheetProps = {
  quoteNumber: string;
  quoteDate: string;

  companyName?: string;
  companyLogoUrl?: string | null;

  customer: string;
  jobReference?: string;
  oemPartNumber: string;
  manufacturer: string;
  machineType: string;
  machineModel?: string;
  edgeType: string;
  profileFamily: string;

  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  holeCount: number;
  holeDiameterMm: number;
  holeRows?: 1 | 2 | 3;
  holeOffset?: boolean;
  holeRowSpacingMm?: number;
  holeOffsetMm?: number;

  bevelRunsPerSide: number;
  leadingEdgeRunsPerSide: number;
  bottomFaceRunsPerSide: number;
  eyebrowType: string;
  eyebrowsPerHole: number;
  runWidthMm?: number;
  leftEndRuns?: number;
  rightEndRuns?: number;

  totalFullLengthRuns: number;
  eyebrowQuantity: number;
  fullLengthAreaCm2: number;
  eyebrowAreaCm2: number;
  endRunQuantity?: number;
  endRunAreaCm2?: number;
  carbideWeightG?: number | null;
  totalAreaCm2: number;

  costRate: number;
  sellRate: number;
  costPrice: number;
  sellPrice: number;
  grossProfit: number;
  grossMargin: number;

  notes?: string;
};

type PrintVariant = "workshop" | "customer";

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
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function QuoteSpecSheet({
  quoteNumber,
  quoteDate,

  companyName,
  companyLogoUrl,

  customer,
  jobReference,
  oemPartNumber,
  manufacturer,
  machineType,
  machineModel,
  edgeType,
  profileFamily,

  lengthMm,
  widthMm,
  thicknessMm,
  holeCount,
  holeDiameterMm,
  holeRows = 1,
  holeOffset = false,
  holeRowSpacingMm = 50,
  holeOffsetMm = 75,

  bevelRunsPerSide,
  leadingEdgeRunsPerSide,
  bottomFaceRunsPerSide,
  eyebrowType,
  eyebrowsPerHole,
  runWidthMm = 25,
  leftEndRuns = 0,
  rightEndRuns = 0,

  totalFullLengthRuns,
  eyebrowQuantity,
  fullLengthAreaCm2,
  eyebrowAreaCm2,
  endRunQuantity = 0,
  endRunAreaCm2 = 0,
  carbideWeightG = null,
  totalAreaCm2,

  costRate,
  sellRate,
  costPrice,
  sellPrice,
  grossProfit,
  grossMargin,

  notes,
}: QuoteSpecSheetProps) {
  const [variant, setVariant] = useState<PrintVariant>("workshop");
  const isCustomerCopy = variant === "customer";

  // profileFamily is passed as the estimate's actual edge_profile
  // value ("single-bevel" | "double-bevel" | "square-edge") by the
  // caller — fall back to double-bevel only if it's something
  // unexpected, so the drawing never silently defaults away from
  // what the part actually is.
  const edgeProfile: EdgeProfile =
    profileFamily === "single-bevel" ||
    profileFamily === "double-bevel" ||
    profileFamily === "square-edge"
      ? profileFamily
      : "double-bevel";

  // eyebrowType arrives as a plain string prop — narrow it to what
  // CoatingLayout actually accepts, so the drawing shows eyebrows
  // whenever the estimate actually has them instead of silently
  // defaulting to "none".
  const normalisedEyebrowType: "none" | "short" | "full" =
    eyebrowType === "short" || eyebrowType === "full" ? eyebrowType : "none";

  function printAs(nextVariant: PrintVariant) {
    setVariant(nextVariant);
    window.setTimeout(() => window.print(), 50);
  }

  return (
    <>
      <div className="print-hidden flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => printAs("workshop")}
          className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Print Workshop Copy
        </button>

        <button
          type="button"
          onClick={() => printAs("customer")}
          className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Print Customer Copy
        </button>
      </div>

      <p className="print-hidden mt-2 text-xs text-slate-500">
        {isCustomerCopy
          ? "Customer copy: cost rate and profit figures are hidden — only the sell price shows."
          : "Workshop copy: shows the full cost breakdown for internal/production use."}
      </p>

      <section
        id="quote-spec-sheet"
        className="quote-sheet mt-6 bg-white text-slate-950"
      >
        <header className="quote-header">
          <div>
            {companyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogoUrl}
                alt={companyName || "Company logo"}
                className="quote-company-logo"
              />
            ) : (
              <p className="quote-business-name">
                {companyName || "TC Applicator"}
              </p>
            )}

            <p className="quote-business-description">
              Tungsten Carbide Coating Quote & Specification
            </p>
          </div>

          <div className="quote-header-details">
            <p>
              <strong>Quote:</strong>{" "}
              {quoteNumber || "Draft"}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {formatDate(quoteDate)}
            </p>
          </div>
        </header>

        <div className="quote-title-block">
          <div>
            <p className="quote-label">
              Customer
            </p>

            <p className="quote-value">
              {customer || "Not specified"}
            </p>
          </div>

          <div>
            <p className="quote-label">
              Job Reference (Pronto)
            </p>

            <p className="quote-value">
              {jobReference || "Not specified"}
            </p>
          </div>

          <div>
            <p className="quote-label">
              OEM Part Number
            </p>

            <p className="quote-value">
              {oemPartNumber || "Not specified"}
            </p>
          </div>
        </div>

        <section className="quote-section">
          <h2 className="quote-section-title">
            Part Identification
          </h2>

          <div className="quote-grid quote-grid-three">
            <SpecificationItem
              label="Manufacturer"
              value={manufacturer}
            />

            <SpecificationItem
              label="Machine Type"
              value={machineType}
            />

            <SpecificationItem
              label="Machine Model"
              value={machineModel}
            />

            <SpecificationItem
              label="Edge Type"
              value={edgeType}
            />

            <SpecificationItem
              label="Profile Family"
              value={profileFamily}
            />

            <SpecificationItem
              label="OEM Part Number"
              value={oemPartNumber}
            />
          </div>
        </section>

        <section className="quote-section">
          <h2 className="quote-section-title">
            Edge Specifications
          </h2>

          <table className="quote-table">
            <thead>
              <tr>
                <th>Length</th>
                <th>Width</th>
                <th>Thickness</th>
                <th>Bolt Holes</th>
                <th>Hole Diameter</th>
                <th>Hole Layout</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{lengthMm || 0} mm</td>
                <td>{widthMm || 0} mm</td>
                <td>{thicknessMm || 0} mm</td>
                <td>{holeCount || 0}</td>
                <td>{holeCount > 0 ? `${holeDiameterMm || 0} mm` : "—"}</td>
                <td>
                  {holeCount === 0
                    ? "None"
                    : `${holeRows > 1 ? `${holeRows} row` : "Single row"}${holeOffset ? ", offset" : ""}`}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="quote-section">
          <h2 className="quote-section-title">
            Coating Pattern
          </h2>

          <table className="quote-table">
            <thead>
              <tr>
                <th>Bevel Runs</th>
                <th>Leading Edge Runs</th>
                <th>Bottom Face Runs</th>
                <th>Eyebrow Type</th>
                <th>Eyebrows per Hole</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{bevelRunsPerSide} per side</td>
                <td>
                  {leadingEdgeRunsPerSide} per side
                </td>
                <td>
                  {bottomFaceRunsPerSide} per side
                  {holeOffset ? " (1 side coated)" : ""}
                </td>
                <td>{eyebrowType || "None"}</td>
                <td>{eyebrowsPerHole}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="quote-section">
          <h2 className="quote-section-title">
            Coating Quantities
          </h2>

          <table className="quote-table">
            <thead>
              <tr>
                <th>Full-Length Runs</th>
                <th>Eyebrow Quantity</th>
                <th>End Runs</th>
                <th>Full-Length Area</th>
                <th>Eyebrow Area</th>
                <th>End Run Area</th>
                <th>Total Coated Area</th>
                <th>Carbide Weight</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{totalFullLengthRuns}</td>
                <td>{eyebrowQuantity}</td>
                <td>{endRunQuantity}</td>
                <td>
                  {fullLengthAreaCm2.toFixed(0)} cm²
                </td>
                <td>
                  {eyebrowAreaCm2.toFixed(0)} cm²
                </td>
                <td>
                  {endRunAreaCm2.toFixed(0)} cm²
                </td>
                <td>
                  {totalAreaCm2.toFixed(0)} cm²
                </td>
                <td>
                  {carbideWeightG !== null && carbideWeightG !== undefined
                    ? formatWeight(carbideWeightG)
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="quote-section quote-section-drawing">
          <h2 className="quote-section-title">
            Coating Layout
          </h2>

          <div className="quote-drawing">
            <CoatingLayout
              lengthMm={lengthMm}
              widthMm={widthMm}
              thicknessMm={thicknessMm}
              holeCount={holeCount}
              holeDiameterMm={holeDiameterMm}
              holeRows={holeRows}
              holeOffset={holeOffset}
              holeRowSpacingMm={holeRowSpacingMm}
              holeOffsetMm={holeOffsetMm}
              edgeProfile={edgeProfile}
              topBevelRuns={bevelRunsPerSide}
              leadingEdgeRuns={leadingEdgeRunsPerSide}
              bottomFaceRuns={bottomFaceRunsPerSide}
              eyebrowType={normalisedEyebrowType}
              eyebrowsPerHole={eyebrowsPerHole}
              runWidthMm={runWidthMm}
              leftEndRuns={leftEndRuns}
              rightEndRuns={rightEndRuns}
            />
          </div>

          <p className="quote-drawing-note">
            Drawing is indicative and should be read together
            with the coating specifications shown on this sheet.
          </p>
        </section>

        <section className="quote-section">
          <h2 className="quote-section-title">
            Commercial Summary
          </h2>

          <div className="quote-commercial-layout">
            {!isCustomerCopy && (
              <table className="quote-table">
                <tbody>
                  <tr>
                    <th>Cost Rate</th>
                    <td>
                      {formatCurrency(costRate)} / cm²
                    </td>
                  </tr>

                  <tr>
                    <th>Sell Rate</th>
                    <td>
                      {formatCurrency(sellRate)} / cm²
                    </td>
                  </tr>

                  <tr>
                    <th>Calculated Cost</th>
                    <td>
                      {formatCurrency(costPrice)}
                    </td>
                  </tr>

                  <tr>
                    <th>Gross Profit</th>
                    <td>
                      {formatCurrency(grossProfit)}
                    </td>
                  </tr>

                  <tr>
                    <th>Gross Margin</th>
                    <td>
                      {grossMargin.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            <div
              className={
                isCustomerCopy ? "quote-total quote-total-full" : "quote-total"
              }
            >
              <p>Quoted Sell Price</p>

              <strong>
                {formatCurrency(sellPrice)}
              </strong>

              <span>Excluding GST</span>
            </div>
          </div>
        </section>

        {notes && !isCustomerCopy && (
          <section className="quote-section">
            <h2 className="quote-section-title">
              Notes
            </h2>

            <div className="quote-notes">
              {notes}
            </div>
          </section>
        )}

        <section className="quote-approval">
          <div>
            <p>Prepared By</p>
            <span />
          </div>

          <div>
            <p>Approved By</p>
            <span />
          </div>

          <div>
            <p>Customer Acceptance</p>
            <span />
          </div>
        </section>

        <footer className="quote-footer">
          <p>
            This quotation is based on the dimensions and coating pattern shown above.
            Final production is subject to confirmation of the physical cutting edge and
            approved coating layout.
          </p>

          <p className="quote-powered-by">Powered by TC Applicator</p>
        </footer>

        {!isCustomerCopy && (
          <div className="quote-workshop-watermark" aria-hidden="true">
            <span>Internal Use — Workshop Copy</span>
          </div>
        )}
      </section>

      <style jsx global>{`
        .quote-sheet {
          width: 100%;
          border: 1px solid #cbd5e1;
          padding: 24px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .quote-header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 3px solid #0f172a;
          padding-bottom: 14px;
        }

        .quote-business-name {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
        }

        .quote-company-logo {
          display: block;
          max-height: 64px;
          width: auto;
        }

        .quote-business-description {
          margin: 5px 0 0;
          font-size: 12px;
          color: #475569;
        }

        .quote-header-details {
          text-align: right;
          font-size: 12px;
        }

        .quote-header-details p {
          margin: 0 0 4px;
        }

        .quote-title-block {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          margin-top: 14px;
          padding: 12px;
        }

        .quote-label {
          margin: 0 0 3px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }

        .quote-value {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
        }

        .quote-section {
          margin-top: 22px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .quote-section-title {
          margin: 0 0 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #334155;
        }

        .quote-grid {
          display: grid;
          gap: 12px;
        }

        .quote-grid-three {
          grid-template-columns: repeat(3, 1fr);
        }

        .quote-specification-item {
          padding: 4px 0;
        }

        .quote-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .quote-table th,
        .quote-table td {
          border-bottom: 1px solid #eef2f7;
          padding: 8px 10px;
          text-align: left;
          vertical-align: middle;
        }

        .quote-table th {
          border-bottom: 1px solid #cbd5e1;
          background: transparent;
          font-weight: 700;
          color: #64748b;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .quote-table tr:last-child td {
          border-bottom: none;
        }

        .quote-section-drawing {
          break-inside: avoid;
          page-break-inside: avoid;
          page-break-before: auto;
        }

        .quote-drawing {
          width: 100%;
          max-width: 620px;
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid #cbd5e1;
          background: white;
          padding: 8px;
        }

        .quote-drawing svg {
          display: block;
          width: 100%;
          height: auto;
          max-height: 330px;
        }

        .quote-drawing-note {
          margin: 6px 0 0;
          font-size: 9px;
          color: #64748b;
        }

        .quote-commercial-layout {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 16px;
          align-items: stretch;
        }

        .quote-total {
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 2px solid #0f172a;
          padding: 16px;
          text-align: center;
        }

        .quote-total-full {
          grid-column: 1 / -1;
        }

        .quote-total p {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .quote-total strong {
          display: block;
          margin: 8px 0;
          font-size: 24px;
        }

        .quote-total span {
          font-size: 10px;
          color: #64748b;
        }

        .quote-notes {
          min-height: 40px;
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          white-space: pre-wrap;
          font-size: 11px;
        }

        .quote-approval {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 14px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .quote-approval p {
          margin: 0;
          font-size: 10px;
          font-weight: 700;
        }

        .quote-approval span {
          display: block;
          height: 22px;
          border-bottom: 1px solid #0f172a;
        }

        .quote-footer {
          margin-top: 10px;
          border-top: 1px solid #cbd5e1;
          padding-top: 6px;
          font-size: 8px;
          color: #64748b;
        }

        .quote-footer p {
          margin: 2px 0;
        }

        .quote-powered-by {
          margin-top: 6px !important;
          color: #94a3b8;
          font-style: italic;
        }

        .quote-workshop-watermark {
          display: none;
        }

        @page {
          size: A4 landscape;
          margin: 8mm;
        }

        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #quote-spec-sheet,
          #quote-spec-sheet * {
            visibility: visible;
          }

          #quote-spec-sheet {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            border: none;
            padding: 0;
          }

          .print-hidden {
            display: none !important;
          }

          .quote-sheet {
            font-size: 10px;
          }

          .quote-section {
            margin-top: 6px;
          }

          .quote-section-title {
            margin-bottom: 5px;
            padding-bottom: 3px;
          }

          .quote-grid {
            gap: 6px;
          }

          .quote-title-block {
            margin-top: 8px;
            padding: 8px;
          }

          .quote-table th,
          .quote-table td {
            padding: 4px 8px;
          }

          .quote-workshop-watermark {
            display: flex;
            position: fixed;
            inset: 0;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 9999;
          }

          .quote-workshop-watermark span {
            transform: rotate(-28deg);
            font-size: 46px;
            font-weight: 800;
            letter-spacing: 1px;
            color: rgba(220, 38, 38, 0.28);
            white-space: nowrap;
          }
        }

        @media screen and (max-width: 800px) {
          .quote-grid-three,
          .quote-title-block,
          .quote-commercial-layout,
          .quote-approval {
            grid-template-columns: 1fr;
          }

          .quote-header {
            flex-direction: column;
          }

          .quote-header-details {
            text-align: left;
          }
        }
      `}</style>
    </>
  );
}

type SpecificationItemProps = {
  label: string;
  value?: string;
};

function SpecificationItem({
  label,
  value,
}: SpecificationItemProps) {
  return (
    <div className="quote-specification-item">
      <p className="quote-label">
        {label}
      </p>

      <p className="m-0 text-sm font-semibold">
        {value || "Not specified"}
      </p>
    </div>
  );
}