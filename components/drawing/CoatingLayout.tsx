type EdgeProfile = "single-bevel" | "double-bevel" | "square-edge";

type CoatingLayoutProps = {
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  holeCount: number;
  holeDiameterMm?: number;
  holeRows?: 1 | 2 | 3;
  holeOffset?: boolean;
  holeRowSpacingMm?: number;
  holeOffsetMm?: number;
  edgeProfile?: EdgeProfile;
  topBevelRuns?: number;
  leadingEdgeRuns?: number;
  bottomFaceRuns?: number;
  eyebrowType?: "none" | "short" | "full";
  eyebrowsPerHole?: number;
  runWidthMm?: number;
};

const COATING_COLOUR = "#f97316";
const STEEL_FILL = "#e5e7eb";
const LINE_COLOUR = "#111827";
const MUTED_TEXT = "#475569";

const EDGE_PROFILE_LABEL: Record<EdgeProfile, string> = {
  "single-bevel": "Single-Bevel",
  "double-bevel": "Double-Bevel",
  "square-edge": "Square-Edge",
};

export default function CoatingLayout({
  lengthMm,
  widthMm,
  thicknessMm,
  holeCount,
  holeDiameterMm = 26,
  holeRows = 1,
  holeOffset = false,
  holeRowSpacingMm = 50,
  holeOffsetMm = 75,
  edgeProfile = "double-bevel",
  topBevelRuns = 2,
  leadingEdgeRuns = 1,
  bottomFaceRuns = 2,
  eyebrowType = "none",
  eyebrowsPerHole = 2,
  runWidthMm = 25,
}: CoatingLayoutProps) {
  const safeHoleCount = Math.max(holeCount, 0);
  const safeLength = Math.max(lengthMm, 1);
  const safeWidth = Math.max(widthMm, 1);
  const safeThickness = Math.max(thicknessMm, 1);
  const safeBottomFaceRuns = Math.max(bottomFaceRuns, 0);
  const safeRowCount = safeHoleCount === 0 ? 0 : holeRows;

  const frontX = 90;
  const frontY = 95;
  const frontWidth = 700;
  const endInset = 20;

  // The plan view used to be a fixed 700x190 box regardless of the
  // part's actual proportions — a long narrow edge and a short wide
  // one rendered identically, just with different mm labels. Instead,
  // derive the height from the real width:length ratio (scaled to the
  // fixed 700px width), clamped so very long/thin or near-square
  // parts don't blow out or collapse the rest of the drawing's
  // fixed-position layout below it.
  const MIN_FRONT_HEIGHT = 90;
  const MAX_FRONT_HEIGHT = 400;
  const BASE_FRONT_HEIGHT = 190; // the original fixed height every downstream y-position below was designed around
  const rawFrontHeight = frontWidth * (safeWidth / safeLength);
  const frontHeight = Math.max(
    MIN_FRONT_HEIGHT,
    Math.min(MAX_FRONT_HEIGHT, rawFrontHeight)
  );
  // How far the plan-view box grew/shrank vs. the original fixed
  // layout — everything below it (pattern summary, side profile,
  // legend) shifts down/up by this same amount so a taller box
  // doesn't start overlapping the fixed-position sections after it.
  const heightDelta = frontHeight - BASE_FRONT_HEIGHT;

  const holeRadius = Math.max(
    7,
    Math.min(16, (holeDiameterMm / safeWidth) * frontHeight * 0.5)
  );

  const holePositions = Array.from(
    { length: safeHoleCount },
    (_, index) => frontX + ((index + 1) * frontWidth) / (safeHoleCount + 1)
  );

  const centreY = frontY + frontHeight / 2;
  const pxPerMm = frontHeight / safeWidth;

  // Fixed margin needed so the hole marker (guide line + circle)
  // never clips the plate edge — independent of frontHeight, unlike
  // the old "+24" / "maxOffsetPx = frontHeight - 68" constants, which
  // were tuned only for the original fixed 190px-tall box and would
  // push the offset row PAST vertical centre (the wrong direction)
  // once very long/narrow parts clamp frontHeight down much smaller.
  const holeMargin = 26;
  const maxOffsetPx = Math.max(0, frontHeight - holeMargin * 2);

  // The centre point the hole row(s) are built around — either the
  // true centre, or shifted toward the top edge when offset is on.
  // The shift is the real mm value scaled to px, clipped so it can
  // never cross past the box's own vertical centre regardless of
  // how short or tall the box ends up.
  const layoutCentreY = holeOffset
    ? frontY +
      holeMargin +
      Math.min(
        Math.max(holeOffsetMm, 0) * pxPerMm,
        Math.min(maxOffsetPx, frontHeight / 2 - holeMargin)
      )
    : centreY;

  const rowSpacingPx = Math.min(Math.max(holeRowSpacingMm, 0) * pxPerMm, maxOffsetPx);

  // Generalized for any row count (1, 2, 3...) — evenly spaced,
  // symmetric around layoutCentreY. A single row collapses to just
  // [layoutCentreY]; 2 rows sit ±half a spacing; 3 rows sit at
  // -1, 0, +1 spacing, etc.
  const rowYs =
    safeRowCount <= 1
      ? [layoutCentreY]
      : Array.from({ length: safeRowCount }, (_, index) => {
          const middleIndex = (safeRowCount - 1) / 2;
          return layoutCentreY + (index - middleIndex) * rowSpacingPx;
        });

  const eyebrowGap = 20;
  const upperEyebrowY = Math.min(...rowYs) - eyebrowGap;
  const lowerEyebrowY = Math.max(...rowYs) + eyebrowGap;

  const profileX = 90;
  const profileY = 410 + heightDelta;
  const profileWidth = 700;

  const displayedThickness = Math.max(55, Math.min(120, safeThickness * 2.2));
  const profileBottom = profileY + displayedThickness;
  const profileTop = profileY + 10;

  const bevelLength = Math.min(145, profileWidth * 0.18);
  const leadingHeight = Math.max(22, displayedThickness * 0.42);

  const isSquare = edgeProfile === "square-edge";
  const isDouble = edgeProfile === "double-bevel";

  let profilePoints: string;
  let frontBevelLine: { start: { x: number; y: number }; end: { x: number; y: number } } | null = null;
  let backBevelLine: { start: { x: number; y: number }; end: { x: number; y: number } } | null = null;
  let frontLeadingX: number;
  let backLeadingX: number | null = null;

  if (isSquare) {
    profilePoints = [
      `${profileX},${profileTop}`,
      `${profileX + profileWidth},${profileTop}`,
      `${profileX + profileWidth},${profileBottom}`,
      `${profileX},${profileBottom}`,
    ].join(" ");
    frontLeadingX = profileX + profileWidth;
    backLeadingX = null;
  } else if (isDouble) {
    profilePoints = [
      `${profileX + bevelLength},${profileTop}`,
      `${profileX + profileWidth - bevelLength},${profileTop}`,
      `${profileX + profileWidth},${profileTop + leadingHeight}`,
      `${profileX + profileWidth},${profileBottom}`,
      `${profileX},${profileBottom}`,
      `${profileX},${profileTop + leadingHeight}`,
    ].join(" ");
    frontBevelLine = {
      start: { x: profileX + profileWidth - bevelLength, y: profileTop },
      end: { x: profileX + profileWidth, y: profileTop + leadingHeight },
    };
    backBevelLine = {
      start: { x: profileX, y: profileTop + leadingHeight },
      end: { x: profileX + bevelLength, y: profileTop },
    };
    frontLeadingX = profileX + profileWidth;
    backLeadingX = profileX;
  } else {
    profilePoints = [
      `${profileX},${profileTop}`,
      `${profileX + profileWidth - bevelLength},${profileTop}`,
      `${profileX + profileWidth},${profileTop + leadingHeight}`,
      `${profileX + profileWidth},${profileBottom}`,
      `${profileX},${profileBottom}`,
    ].join(" ");
    frontBevelLine = {
      start: { x: profileX + profileWidth - bevelLength, y: profileTop },
      end: { x: profileX + profileWidth, y: profileTop + leadingHeight },
    };
    backBevelLine = null;
    frontLeadingX = profileX + profileWidth;
    backLeadingX = null;
  }

  const leadingFaceTopY = isSquare ? profileTop : profileTop + leadingHeight;

  const eyebrowHoleMultiplier = Math.max(safeRowCount, 1);
  const eyebrowSummary =
    eyebrowType === "full"
      ? "Full length"
      : eyebrowType === "short"
        ? `${safeHoleCount * eyebrowHoleMultiplier * eyebrowsPerHole} short`
        : "None";

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 880 ${Math.max(500, 640 + heightDelta)}`}
        role="img"
        aria-label="Cutting edge coating layout"
        className="min-w-[760px] w-full"
      >
        <defs>
          <marker id="arrow-start" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M8 0 L0 4 L8 8 Z" fill={LINE_COLOUR} />
          </marker>
          <marker id="arrow-end" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill={LINE_COLOUR} />
          </marker>
        </defs>

        <text x="40" y="34" fontSize="18" fontWeight="600">
          Underside View
        </text>
        <text x="40" y="58" fontSize="13" fill={MUTED_TEXT}>
          Bottom working face only
        </text>

        <g>
          <line
            x1={frontX}
            y1={68}
            x2={frontX + frontWidth}
            y2={68}
            stroke={LINE_COLOUR}
            strokeWidth="1"
            markerStart="url(#arrow-start)"
            markerEnd="url(#arrow-end)"
          />
          <line x1={frontX} y1={76} x2={frontX} y2={frontY - 8} stroke={LINE_COLOUR} />
          <line
            x1={frontX + frontWidth}
            y1={76}
            x2={frontX + frontWidth}
            y2={frontY - 8}
            stroke={LINE_COLOUR}
          />
          <text
            x={frontX + frontWidth / 2}
            y={58}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
          >
            {lengthMm || 0} mm
          </text>
        </g>

        <rect
          x={frontX}
          y={frontY}
          width={frontWidth}
          height={frontHeight}
          fill={STEEL_FILL}
          stroke={LINE_COLOUR}
          strokeWidth="2"
        />

        {Array.from({ length: safeBottomFaceRuns }).map((_, index) => {
          const offset = 6 + index * 13;

          return (
            <g key={`bottom-face-plan-${index}`}>
              {!holeOffset && (
                <line
                  x1={frontX}
                  y1={frontY + offset}
                  x2={frontX + frontWidth}
                  y2={frontY + offset}
                  stroke={COATING_COLOUR}
                  strokeWidth="11"
                />
              )}
              <line
                x1={frontX}
                y1={frontY + frontHeight - offset}
                x2={frontX + frontWidth}
                y2={frontY + frontHeight - offset}
                stroke={COATING_COLOUR}
                strokeWidth="11"
              />
            </g>
          );
        })}

        {eyebrowType === "full" && (
          <>
            <line
              x1={frontX}
              y1={upperEyebrowY}
              x2={frontX + frontWidth}
              y2={upperEyebrowY}
              stroke={COATING_COLOUR}
              strokeWidth="9"
            />
            <line
              x1={frontX}
              y1={lowerEyebrowY}
              x2={frontX + frontWidth}
              y2={lowerEyebrowY}
              stroke={COATING_COLOUR}
              strokeWidth="9"
            />
          </>
        )}

        {holePositions.map((x, index) => (
          <g key={`hole-column-${index}`}>
            <line
              x1={x}
              y1={frontY + 34}
              x2={x}
              y2={frontY + frontHeight - 34}
              stroke="#64748b"
              strokeDasharray="5 5"
            />

            {rowYs.map((y, rowIndex) => (
              <g key={`hole-${index}-row-${rowIndex}`}>
                <line x1={x - 23} y1={y} x2={x + 23} y2={y} stroke="#64748b" />
                <circle
                  cx={x}
                  cy={y}
                  r={holeRadius}
                  fill="white"
                  stroke={LINE_COLOUR}
                  strokeWidth="1.5"
                />
              </g>
            ))}

            {eyebrowType === "short" && eyebrowsPerHole >= 1 && (
              <line
                x1={x - 24}
                y1={upperEyebrowY}
                x2={x + 24}
                y2={upperEyebrowY}
                stroke={COATING_COLOUR}
                strokeWidth="9"
              />
            )}
            {eyebrowType === "short" && eyebrowsPerHole >= 2 && (
              <line
                x1={x - 24}
                y1={lowerEyebrowY}
                x2={x + 24}
                y2={lowerEyebrowY}
                stroke={COATING_COLOUR}
                strokeWidth="9"
              />
            )}
          </g>
        ))}

        <g>
          <line
            x1={frontX + frontWidth + 35}
            y1={frontY}
            x2={frontX + frontWidth + 35}
            y2={frontY + frontHeight}
            stroke={LINE_COLOUR}
            markerStart="url(#arrow-start)"
            markerEnd="url(#arrow-end)"
          />
          <line
            x1={frontX + frontWidth + 8}
            y1={frontY}
            x2={frontX + frontWidth + 43}
            y2={frontY}
            stroke={LINE_COLOUR}
          />
          <line
            x1={frontX + frontWidth + 8}
            y1={frontY + frontHeight}
            x2={frontX + frontWidth + 43}
            y2={frontY + frontHeight}
            stroke={LINE_COLOUR}
          />
          <text
            x={frontX + frontWidth + 64}
            y={frontY + frontHeight / 2}
            transform={`rotate(90 ${frontX + frontWidth + 64} ${frontY + frontHeight / 2})`}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
          >
            {widthMm || 0} mm
          </text>
        </g>

        <g transform={`translate(90 ${320 + heightDelta})`}>
          <rect x="0" y="0" width="700" height="54" rx="6" fill="#f8fafc" stroke="#cbd5e1" />

          <text x="18" y="21" fontSize="12" fill={MUTED_TEXT}>
            Bevel
          </text>
          <text x="18" y="41" fontSize="14" fontWeight="600">
            {isSquare ? "—" : `×${topBevelRuns}`}
          </text>

          <text x="150" y="21" fontSize="12" fill={MUTED_TEXT}>
            Leading edge
          </text>
          <text x="150" y="41" fontSize="14" fontWeight="600">
            ×{leadingEdgeRuns}
          </text>

          <text x="330" y="21" fontSize="12" fill={MUTED_TEXT}>
            Bottom face
          </text>
          <text x="330" y="41" fontSize="14" fontWeight="600">
            ×{bottomFaceRuns}
            {holeOffset ? " (1 side)" : ""}
          </text>

          <text x="505" y="21" fontSize="12" fill={MUTED_TEXT}>
            Eyebrows
          </text>
          <text x="505" y="41" fontSize="14" fontWeight="600">
            {eyebrowSummary}
          </text>
        </g>

        <text x="40" y={profileY} fontSize="18" fontWeight="600">
          {EDGE_PROFILE_LABEL[edgeProfile]} Side Profile
        </text>

        <polygon points={profilePoints} fill={STEEL_FILL} stroke={LINE_COLOUR} strokeWidth="2" />

        {/* Each bevel run's 25mm width is measured ALONG the slope
            (its length travels into the page, the axis this
            cross-section can't show) — so runs tile as short dashes
            along the bevel line, not as near-duplicate lines each
            stretching almost the full slope. */}
        {!isSquare &&
          Array.from({ length: topBevelRuns }).map((_, index) => {
            // Fixed-size dash (not the slope divided evenly by run
            // count) — otherwise a single run would stretch across
            // nearly the whole bevel. Tiles from the BOTTOM of the
            // bevel (where it meets the leading edge, t=1) upward
            // toward the top corner (t=0) as more runs are added.
            const gapFrac = 0.05;
            let dashFrac = 0.35;
            const totalNeeded = topBevelRuns * dashFrac + (topBevelRuns - 1) * gapFrac;
            if (totalNeeded > 0.95) {
              dashFrac = (0.95 - (topBevelRuns - 1) * gapFrac) / topBevelRuns;
            }

            const step = dashFrac + gapFrac;

            function lerp(
              start: { x: number; y: number },
              end: { x: number; y: number },
              t: number
            ) {
              return {
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t,
              };
            }

            return (
              <g key={`bevel-run-${index}`}>
                {frontBevelLine && (() => {
                  // frontBevelLine.end IS the bottom (where it meets
                  // the leading edge) — anchor at t=1, step toward t=0.
                  const tEnd = 1 - index * step;
                  const tStart = tEnd - dashFrac;
                  const from = lerp(frontBevelLine.start, frontBevelLine.end, tStart);
                  const to = lerp(frontBevelLine.start, frontBevelLine.end, tEnd);
                  return (
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={COATING_COLOUR}
                      strokeWidth="7"
                    />
                  );
                })()}
                {backBevelLine && (() => {
                  // backBevelLine.start IS the bottom (opposite point
                  // order to the front line) — anchor at t=0 instead.
                  const tStart = index * step;
                  const tEnd = tStart + dashFrac;
                  const from = lerp(backBevelLine.start, backBevelLine.end, tStart);
                  const to = lerp(backBevelLine.start, backBevelLine.end, tEnd);
                  return (
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={COATING_COLOUR}
                      strokeWidth="7"
                    />
                  );
                })()}
              </g>
            );
          })}

        {/* Same fix as the bevel runs — a leading-edge run's 25mm
            width is measured along the face's own height (vertical
            here), so runs tile top-to-bottom as short dashes at a
            single x position, not as parallel lines each spanning
            the full face height offset sideways. */}
        {Array.from({ length: leadingEdgeRuns }).map((_, index) => {
          const segFrac = 1 / leadingEdgeRuns;
          const gap = segFrac * 0.06;
          const faceTop = leadingFaceTopY + 5;
          const faceBottom = profileBottom - 6;
          const yStart = faceTop + (faceBottom - faceTop) * (index * segFrac + gap);
          const yEnd = faceTop + (faceBottom - faceTop) * ((index + 1) * segFrac - gap);

          return (
            <g key={`leading-run-${index}`}>
              <line
                x1={frontLeadingX - 5}
                y1={yStart}
                x2={frontLeadingX - 5}
                y2={yEnd}
                stroke={COATING_COLOUR}
                strokeWidth="7"
              />
              {backLeadingX !== null && (
                <line
                  x1={backLeadingX + 5}
                  y1={yStart}
                  x2={backLeadingX + 5}
                  y2={yEnd}
                  stroke={COATING_COLOUR}
                  strokeWidth="7"
                />
              )}
            </g>
          );
        })}

        {/* Bottom-face runs actually travel the full LENGTH of the
            edge — the axis going into the page in this cross-section
            view, not left-right. Each run shows as a short 25mm-scale
            dash near the relevant side (front/back). Multiple runs on
            the same side tile side by side, extending further inward
            from the corner — not stacked in layers on top of each
            other, which would misrepresent them as being at different
            heights on a face that's actually flat. */}
        {(() => {
          const dashLength = Math.min(50, profileWidth * 0.07);
          const dashGap = 2;
          const y = profileBottom - 4;

          return Array.from({ length: bottomFaceRuns }).map((_, index) => {
            // Match the bevel/leading-edge convention: "front" is the
            // right/beveled side (profileX + profileWidth), "back" is
            // the left side (profileX) — front always shows, back
            // only when the part isn't hole-offset. Previously these
            // were swapped relative to the bevel/leading-edge dashes,
            // so a holeOffset part suppressed the wrong side.
            const frontEnd = profileX + profileWidth - 8 - index * (dashLength + dashGap);
            const frontStart = frontEnd - dashLength;

            const backStart = profileX + 8 + index * (dashLength + dashGap);
            const backEnd = backStart + dashLength;

            return (
              <g key={`bottom-run-${index}`}>
                <line
                  x1={frontStart}
                  y1={y}
                  x2={frontEnd}
                  y2={y}
                  stroke={COATING_COLOUR}
                  strokeWidth="7"
                />
                {!holeOffset && (
                  <line
                    x1={backStart}
                    y1={y}
                    x2={backEnd}
                    y2={y}
                    stroke={COATING_COLOUR}
                    strokeWidth="7"
                  />
                )}
              </g>
            );
          });
        })()}

        <g>
          <line
            x1={profileX - 28}
            y1={profileTop}
            x2={profileX - 28}
            y2={profileBottom}
            stroke={LINE_COLOUR}
            markerStart="url(#arrow-start)"
            markerEnd="url(#arrow-end)"
          />
          <text
            x={profileX - 48}
            y={(profileTop + profileBottom) / 2}
            transform={`rotate(-90 ${profileX - 48} ${(profileTop + profileBottom) / 2})`}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
          >
            {thicknessMm || 0} mm
          </text>
        </g>

        <g transform={`translate(90 ${600 + heightDelta})`}>
          <line x1="0" y1="0" x2="42" y2="0" stroke={COATING_COLOUR} strokeWidth="8" />
          <text x="55" y="5" fontSize="13">
            Individual tungsten coating run
          </text>
          <text x="320" y="5" fontSize="13">
            Standard run width: {runWidthMm} mm
          </text>
        </g>
      </svg>
    </div>
  );
}