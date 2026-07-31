"use client";

import CoatingLayout from "@/components/drawing/CoatingLayout";

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

  bevelRunsPerSide: number;
  leadingEdgeRunsPerSide: number;
  bottomFaceRunsPerSide: number;
  eyebrowType: string;
  eyebrowsPerHole: number;

  totalFullLengthRuns: number;
  eyebrowQuantity: number;
  fullLengthAreaCm2: number;
  eyebrowAreaCm2: number;
  totalAreaCm2: number;

  costRate: number;
  sellRate: number;
  costPrice: number;
  sellPrice: number;
  grossProfit: number;
  grossMargin: number;

  notes?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
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

  bevelRunsPerSide,
  leadingEdgeRunsPerSide,
  bottomFaceRunsPerSide,
  eyebrowType,
  eyebrowsPerHole,

  totalFullLengthRuns,
  eyebrowQuantity,
  fullLengthAreaCm2,
  eyebrowAreaCm2,
  totalAreaCm2,

  costRate,
  sellRate,
  costPrice,
  sellPrice,
  grossProfit,
  grossMargin,

  notes,
}: QuoteSpecSheetProps) {
  function printQuote() {
    window.print();
  }

  return (
    <>
      <button
        type="button"
        onClick={printQuote}
        className="print-hidden w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Print Quote & Specification
      </button>

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
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{lengthMm || 0} mm</td>
                <td>{widthMm || 0} mm</td>
                <td>{thicknessMm || 0} mm</td>
                <td>{holeCount || 0}</td>
                <td>{holeDiameterMm || 0} mm</td>
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
                </td>
                <td>{eyebrowType || "None"}</td>
                <td>{eyebrowsPerHole}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="quote-section">
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
              topBevelRuns={bevelRunsPerSide}
              leadingEdgeRuns={leadingEdgeRunsPerSide}
              bottomFaceRuns={bottomFaceRunsPerSide}
              eyebrowsPerHole={eyebrowsPerHole}
            />
          </div>

          <p className="quote-drawing-note">
            Drawing is indicative and should be read together
            with the coating specifications shown on this sheet.
          </p>
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
                <th>Full-Length Area</th>
                <th>Eyebrow Area</th>
                <th>Total Coated Area</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{totalFullLengthRuns}</td>
                <td>{eyebrowQuantity}</td>
                <td>
                  {fullLengthAreaCm2.toFixed(0)} cm²
                </td>
                <td>
                  {eyebrowAreaCm2.toFixed(0)} cm²
                </td>
                <td>
                  {totalAreaCm2.toFixed(0)} cm²
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="quote-section">
          <h2 className="quote-section-title">
            Commercial Summary
          </h2>

          <div className="quote-commercial-layout">
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

            <div className="quote-total">
              <p>Quoted Sell Price</p>

              <strong>
                {formatCurrency(sellPrice)}
              </strong>

              <span>Excluding GST</span>
            </div>
          </div>
        </section>

        {notes && (
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
            This quotation is based on the dimensions and
            coating pattern shown above.
          </p>

          <p>
            Final production is subject to confirmation of the
            physical cutting edge and approved coating layout.
          </p>

          <p className="quote-powered-by">Powered by TC Applicator</p>
        </footer>
      </section>

      <style jsx global>{`
        .quote-sheet {
          width: 100%;
          border: 1px solid #cbd5e1;
          padding: 28px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .quote-header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 3px solid #0f172a;
          padding-bottom: 18px;
        }

        .quote-business-name {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .quote-company-logo {
          display: block;
          max-height: 52px;
          width: auto;
        }

        .quote-business-description {
          margin: 5px 0 0;
          font-size: 13px;
          color: #475569;
        }

        .quote-header-details {
          text-align: right;
          font-size: 13px;
        }

        .quote-header-details p {
          margin: 0 0 5px;
        }

        .quote-title-block {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          margin-top: 18px;
          padding: 14px;
        }

        .quote-label {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }

        .quote-value {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }

        .quote-section {
          margin-top: 22px;
          break-inside: avoid;
        }

        .quote-section-title {
          margin: 0 0 10px;
          border-bottom: 1px solid #94a3b8;
          padding-bottom: 5px;
          font-size: 15px;
          font-weight: 700;
        }

        .quote-grid {
          display: grid;
          gap: 1px;
          overflow: hidden;
          border: 1px solid #cbd5e1;
          background: #cbd5e1;
        }

        .quote-grid-three {
          grid-template-columns: repeat(3, 1fr);
        }

        .quote-specification-item {
          min-height: 64px;
          background: white;
          padding: 10px;
        }

        .quote-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .quote-table th,
        .quote-table td {
          border: 1px solid #cbd5e1;
          padding: 8px;
          text-align: left;
          vertical-align: middle;
        }

        .quote-table th {
          background: #f1f5f9;
          font-weight: 700;
        }

        .quote-drawing {
          width: 100%;
          overflow: hidden;
          border: 1px solid #cbd5e1;
          background: white;
          padding: 10px;
        }

        .quote-drawing svg {
          display: block;
          width: 100%;
          max-height: 400px;
        }

        .quote-drawing-note {
          margin: 7px 0 0;
          font-size: 10px;
          color: #64748b;
        }

        .quote-commercial-layout {
          display: grid;
          grid-template-columns: 1fr 230px;
          gap: 18px;
          align-items: stretch;
        }

        .quote-total {
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 2px solid #0f172a;
          padding: 18px;
          text-align: center;
        }

        .quote-total p {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .quote-total strong {
          display: block;
          margin: 8px 0;
          font-size: 25px;
        }

        .quote-total span {
          font-size: 10px;
          color: #64748b;
        }

        .quote-notes {
          min-height: 80px;
          border: 1px solid #cbd5e1;
          padding: 12px;
          white-space: pre-wrap;
          font-size: 12px;
        }

        .quote-approval {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
          margin-top: 35px;
          break-inside: avoid;
        }

        .quote-approval p {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
        }

        .quote-approval span {
          display: block;
          height: 35px;
          border-bottom: 1px solid #0f172a;
        }

        .quote-footer {
          margin-top: 25px;
          border-top: 1px solid #cbd5e1;
          padding-top: 10px;
          font-size: 9px;
          color: #64748b;
        }

        .quote-footer p {
          margin: 2px 0;
        }

        .quote-powered-by {
          margin-top: 8px !important;
          color: #94a3b8;
          font-style: italic;
        }

        @page {
          size: A4 portrait;
          margin: 10mm;
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
            font-size: 11px;
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