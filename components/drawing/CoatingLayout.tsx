type EdgeProfile = "single-bevel" | "double-bevel" | "square-edge";

type CoatingLayoutProps = {
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  holeCount: number;
  holeDiameterMm?: number;
  edgeProfile?: EdgeProfile;
  topBevelRuns?: number;
  leadingEdgeRuns?: number;
  bottomFaceRuns?: number;
  eyebrowType?: "none" | "short" | "full";
  eyebrowsPerHole?: number;
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
  edgeProfile = "double-bevel",
  topBevelRuns = 2,
  leadingEdgeRuns = 1,
  bottomFaceRuns = 2,
  eyebrowType = "none",
  eyebrowsPerHole = 2,
}: CoatingLayoutProps) {
  const safeHoleCount = Math.max(holeCount, 0);
  const safeWidth = Math.max(widthMm, 1);
  const safeThickness = Math.max(thicknessMm, 1);
  const safeBottomFaceRuns = Math.max(bottomFaceRuns, 0);

  const frontX = 90;
  const frontY = 95;
  const frontWidth = 700;
  const frontHeight = 190;
  const endInset = 20;

  const holeRadius = Math.max(
    7,
    Math.min(16, (holeDiameterMm / safeWidth) * frontHeight * 0.5)
  );

  const holePositions = Array.from(
    { length: safeHoleCount },
    (_, index) => frontX + ((index + 1) * frontWidth) / (safeHoleCount + 1)
  );

  const centreY = frontY + frontHeight / 2;
  const upperEyebrowY = centreY - 34;
  const lowerEyebrowY = centreY + 34;

  const profileX = 90;
  const profileY = 410;
  const profileWidth = 700;

  const displayedThickness = Math.max(55, Math.min(120, safeThickness * 2.2));
  const profileBottom = profileY + displayedThickness;
  const profileTop = profileY + 10;

  const bevelLength = Math.min(145, profileWidth * 0.18);
  const leadingHeight = Math.max(22, displayedThickness * 0.42);

  const isSquare = edgeProfile === "square-edge";
  const isDouble = edgeProfile === "double-bevel";

  // ---- Section profile geometry, branched by edge profile ----
  let profilePoints: string;
  let frontBevelLine: { start: { x: number; y: number }; end: { x: number; y: number } } | null = null;
  let backBevelLine: { start: { x: number; y: number }; end: { x: number; y: number } } | null = null;
  let frontLeadingX: number;
  let backLeadingX: number | null = null;

  if (isSquare) {
    // Plain rectangle. No bevel geometry at all.
    profilePoints = [
      `${profileX},${profileTop}`,
      `${profileX + profileWidth},${profileTop}`,
      `${profileX + profileWidth},${profileBottom}`,
      `${profileX},${profileBottom}`,
    ].join(" ");
    frontLeadingX = profileX + profileWidth;
    backLeadingX = null; // back face is a plain uncoated heel, nothing drawn
  } else if (isDouble) {
    // Symmetric hexagon: bevel + leading face on both ends.
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
    // single-bevel: bevel + leading face on the front (right) only;
    // the back (left) is a plain vertical uncoated heel.
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

  const eyebrowSummary =
    eyebrowType === "full"
      ? "Full length"
      : eyebrowType === "short"
        ? `${safeHoleCount * eyebrowsPerHole} short`
        : "None";

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 880 640"
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

        <polygon
          points={[
            `${frontX + endInset},${frontY}`,
            `${frontX + frontWidth - endInset},${frontY}`,
            `${frontX + frontWidth},${frontY + endInset}`,
            `${frontX + frontWidth},${frontY + frontHeight - endInset}`,
            `${frontX + frontWidth - endInset},${frontY + frontHeight}`,
            `${frontX + endInset},${frontY + frontHeight}`,
            `${frontX},${frontY + frontHeight - endInset}`,
            `${frontX},${frontY + endInset}`,
          ].join(" ")}
          fill={STEEL_FILL}
          stroke={LINE_COLOUR}
          strokeWidth="2"
        />

        {/* Bottom-face runs, plan view — one strip per run, stacking
            inward from each long edge. Was previously two hardcoded
            strips regardless of bottomFaceRuns; now scales properly,
            including drawing nothing at 0. */}
        {Array.from({ length: safeBottomFaceRuns }).map((_, index) => {
          const offset = 14 + index * 13;

          return (
            <g key={`bottom-face-plan-${index}`}>
              <line
                x1={frontX + endInset}
                y1={frontY + offset}
                x2={frontX + frontWidth - endInset}
                y2={frontY + offset}
                stroke={COATING_COLOUR}
                strokeWidth="11"
              />
              <line
                x1={frontX + endInset}
                y1={frontY + frontHeight - offset}
                x2={frontX + frontWidth - endInset}
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
              x1={frontX + endInset}
              y1={upperEyebrowY}
              x2={frontX + frontWidth - endInset}
              y2={upperEyebrowY}
              stroke={COATING_COLOUR}
              strokeWidth="9"
            />
            <line
              x1={frontX + endInset}
              y1={lowerEyebrowY}
              x2={frontX + frontWidth - endInset}
              y2={lowerEyebrowY}
              stroke={COATING_COLOUR}
              strokeWidth="9"
            />
          </>
        )}

        {holePositions.map((x, index) => (
          <g key={`hole-${index}`}>
            <line
              x1={x}
              y1={frontY + 34}
              x2={x}
              y2={frontY + frontHeight - 34}
              stroke="#64748b"
              strokeDasharray="5 5"
            />
            <line x1={x - 23} y1={centreY} x2={x + 23} y2={centreY} stroke="#64748b" />
            <circle
              cx={x}
              cy={centreY}
              r={holeRadius}
              fill="white"
              stroke={LINE_COLOUR}
              strokeWidth="1.5"
            />

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

        <g transform="translate(90 320)">
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
          </text>

          <text x="505" y="21" fontSize="12" fill={MUTED_TEXT}>
            Eyebrows
          </text>
          <text x="505" y="41" fontSize="14" fontWeight="600">
            {eyebrowSummary}
          </text>
        </g>

        <text x="40" y="410" fontSize="18" fontWeight="600">
          {EDGE_PROFILE_LABEL[edgeProfile]} Side Profile
        </text>

        <polygon points={profilePoints} fill={STEEL_FILL} stroke={LINE_COLOUR} strokeWidth="2" />

        {!isSquare &&
          Array.from({ length: topBevelRuns }).map((_, index) => {
            const offset = 7 + index * 11;

            return (
              <g key={`bevel-run-${index}`}>
                {frontBevelLine && (
                  <line
                    x1={frontBevelLine.start.x + offset * 0.2}
                    y1={frontBevelLine.start.y + offset * 0.55}
                    x2={frontBevelLine.end.x - offset * 0.75}
                    y2={frontBevelLine.end.y - offset * 0.55}
                    stroke={COATING_COLOUR}
                    strokeWidth="7"
                  />
                )}
                {backBevelLine && (
                  <line
                    x1={backBevelLine.start.x + offset * 0.75}
                    y1={backBevelLine.start.y - offset * 0.55}
                    x2={backBevelLine.end.x - offset * 0.2}
                    y2={backBevelLine.end.y + offset * 0.55}
                    stroke={COATING_COLOUR}
                    strokeWidth="7"
                  />
                )}
              </g>
            );
          })}

        {Array.from({ length: leadingEdgeRuns }).map((_, index) => {
          const offset = index * 9;

          return (
            <g key={`leading-run-${index}`}>
              <line
                x1={frontLeadingX - 5 - offset}
                y1={leadingFaceTopY + 5}
                x2={frontLeadingX - 5 - offset}
                y2={profileBottom - 6}
                stroke={COATING_COLOUR}
                strokeWidth="7"
              />
              {backLeadingX !== null && (
                <line
                  x1={backLeadingX + 5 + offset}
                  y1={leadingFaceTopY + 5}
                  x2={backLeadingX + 5 + offset}
                  y2={profileBottom - 6}
                  stroke={COATING_COLOUR}
                  strokeWidth="7"
                />
              )}
            </g>
          );
        })}

        {Array.from({ length: bottomFaceRuns }).map((_, index) => {
          const y = profileBottom - 5 - index * 11;

          return (
            <line
              key={`bottom-run-${index}`}
              x1={profileX + 18}
              y1={y}
              x2={profileX + profileWidth - 18}
              y2={y}
              stroke={COATING_COLOUR}
              strokeWidth="7"
            />
          );
        })}

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

        <g transform="translate(90 600)">
          <line x1="0" y1="0" x2="42" y2="0" stroke={COATING_COLOUR} strokeWidth="8" />
          <text x="55" y="5" fontSize="13">
            Individual tungsten coating run
          </text>
          <text x="320" y="5" fontSize="13">
            Standard run width: 25 mm
          </text>
        </g>
      </svg>
    </div>
  );
}