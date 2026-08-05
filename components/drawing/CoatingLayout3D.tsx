type EdgeProfile = "single-bevel" | "double-bevel" | "square-edge";

type CoatingLayout3DProps = {
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  holeCount: number;
  holeRows?: 1 | 2 | 3;
  holeOffset?: boolean;
  edgeProfile?: EdgeProfile;
  topBevelRuns?: number;
  leadingEdgeRuns?: number;
  bottomFaceRuns?: number;
};

const COATING_COLOUR = "#f97316";
// Blueprint/line-art palette — thin outlines on a near-white fill,
// rather than the solid shaded blocks of the first pass.
const LINE_COLOUR = "#1d4ed8";
const FACE_FILL = "#ffffff";
const FAINT_FILL = "#f8fafc";

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

type Point3 = { x: number; y: number; z: number };
type Point2 = { x: number; y: number };

function project(p: Point3, originX: number, originY: number): Point2 {
  return {
    x: originX + (p.x - p.y) * COS30,
    y: originY + (p.x + p.y) * SIN30 - p.z,
  };
}

function pointsAttr(points: Point2[]) {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}


export default function CoatingLayout3D({
  lengthMm,
  widthMm,
  thicknessMm,
  holeCount,
  holeRows = 1,
  holeOffset = false,
  edgeProfile = "double-bevel",
  topBevelRuns = 2,
  leadingEdgeRuns = 1,
  bottomFaceRuns = 2,
}: CoatingLayout3DProps) {
  const safeLength = Math.max(lengthMm, 1);
  const safeWidth = Math.max(widthMm, 1);
  const safeThickness = Math.max(thicknessMm, 1);
  const safeHoleCount = Math.max(holeCount, 0);
  const safeRows = safeHoleCount === 0 ? 0 : holeRows;

  // W and L must share ONE scale derived from the real width:length
  // ratio — previously W was a fixed constant independent of the
  // actual widthMm, so the two axes had no real relationship to each
  // other and long/narrow parts looked artificially squat. L is the
  // fixed reference axis (these edges are always length-dominant);
  // W is derived from it via the real ratio, then clamped so an
  // unusually wide or narrow part doesn't collapse or blow out the
  // rest of the layout.
  const L = 400;
  const rawW = L * (safeWidth / safeLength);
  const W = Math.max(90, Math.min(260, rawW));
  // T now derives from the SAME basis as W (via the real
  // thickness:width ratio) instead of an independent formula — that
  // previously made thin blade-like edges render disproportionately
  // tall/slab-like once W/L were fixed relative to real dimensions.
  const rawT = W * (safeThickness / safeWidth);
  const T = Math.max(18, Math.min(90, rawT));

  const isSquare = edgeProfile === "square-edge";
  const isDouble = edgeProfile === "double-bevel";
  const bevelLength = Math.min(42, W * 0.18);
  const leadingHeight = Math.max(8, Math.min(T * 0.82, T - 6));

  let profile: Point2[];

  if (isSquare) {
    profile = [
      { x: 0, y: T },
      { x: W, y: T },
      { x: W, y: 0 },
      { x: 0, y: 0 },
    ];
  } else if (isDouble) {
    profile = [
      { x: bevelLength, y: T },
      { x: W - bevelLength, y: T },
      { x: W, y: T - leadingHeight },
      { x: W, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: T - leadingHeight },
    ];
  } else {
    profile = [
      { x: 0, y: T },
      { x: W - bevelLength, y: T },
      { x: W, y: T - leadingHeight },
      { x: W, y: 0 },
      { x: 0, y: 0 },
    ];
  }

  function local3(yLocal: number, zLocal: number, xLocal: number): Point3 {
    return { x: xLocal, y: yLocal, z: zLocal };
  }

  const originX = 60;
  const originY = 90;

  const nearFace = profile.map((p) => project(local3(p.x, p.y, 0), originX, originY));
  const farFace = profile.map((p) => project(local3(p.x, p.y, L), originX, originY));

  const sideQuads: Point2[][] = [];
  for (let i = 0; i < profile.length; i++) {
    const a = profile[i];
    const b = profile[(i + 1) % profile.length];
    const isBottomEdge = a.y === 0 && b.y === 0;
    if (isBottomEdge) continue;

    const p1 = project(local3(a.x, a.y, 0), originX, originY);
    const p2 = project(local3(b.x, b.y, 0), originX, originY);
    const p3 = project(local3(b.x, b.y, L), originX, originY);
    const p4 = project(local3(a.x, a.y, L), originX, originY);

    sideQuads.push([p1, p2, p3, p4]);
  }

  const holePositions = Array.from({ length: safeHoleCount }, (_, i) => {
    return ((i + 1) / (safeHoleCount + 1)) * L;
  });

  const rowYLocals =
    safeRows <= 1
      ? [holeOffset ? W * 0.22 : W / 2]
      : Array.from({ length: safeRows }, (_, i) => {
          const mid = (safeRows - 1) / 2;
          const base = holeOffset ? W * 0.22 : W / 2;
          return base + (i - mid) * (W * 0.12);
        });

  function stripPoints(yLocal: number, zLocal: number, widthPx: number) {
    const p1 = project(local3(yLocal, zLocal, 0), originX, originY);
    const p2 = project(local3(yLocal, zLocal, L), originX, originY);
    return { p1, p2, widthPx };
  }

  const bevelStrips: ReturnType<typeof stripPoints>[] = [];
  if (!isSquare && topBevelRuns > 0) {
    // The actual slope segment — top-of-bevel to where it meets the
    // leading edge. This exact segment exists identically in both
    // the single- and double-bevel profiles, on the same (front,
    // y=W) side as the leading edge strips below, so bevel and
    // leading-edge coating always land on the same visible face.
    const bevelStart = { x: W - bevelLength, y: T };
    const bevelEnd = { x: W, y: T - leadingHeight };
    for (let i = 0; i < topBevelRuns; i++) {
      const t = (i + 0.5) / topBevelRuns;
      const yLocal = bevelStart.x + (bevelEnd.x - bevelStart.x) * t;
      const zLocal = bevelStart.y + (bevelEnd.y - bevelStart.y) * t;
      bevelStrips.push(stripPoints(yLocal, zLocal, 5));
    }
  }

  const leadingStrips: ReturnType<typeof stripPoints>[] = [];
  if (leadingEdgeRuns > 0) {
    const topZ = T - leadingHeight;
    for (let i = 0; i < leadingEdgeRuns; i++) {
      const t = (i + 0.5) / leadingEdgeRuns;
      const zLocal = topZ * (1 - t) + 2;
      leadingStrips.push(stripPoints(W, zLocal, 5));
    }
  }

  // Bottom-face coating lives on the underside, which genuinely isn't
  // visible from this angle — SVG has no depth/occlusion, so drawing
  // it would just show through the solid faces on top of it rather
  // than being physically hidden. Only draw coating on faces the
  // camera can actually see.

  const allPoints = [...nearFace, ...farFace];
  const minX = Math.min(...allPoints.map((p) => p.x));
  const maxX = Math.max(...allPoints.map((p) => p.x));
  const minY = Math.min(...allPoints.map((p) => p.y));
  const maxY = Math.max(...allPoints.map((p) => p.y));
  const vbWidth = maxX - minX + 40;
  const vbHeight = maxY - minY + 60;
  const viewBox = `${minX - 20} ${minY - 20} ${vbWidth} ${vbHeight}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={viewBox}
        role="img"
        aria-label="3D coating preview"
        className="w-full"
        style={{ aspectRatio: `${vbWidth} / ${vbHeight}`, minWidth: 420 }}
      >
        {sideQuads.map((quad, i) => (
          <polygon
            key={`quad-${i}`}
            points={pointsAttr(quad)}
            fill={FAINT_FILL}
            stroke={LINE_COLOUR}
            strokeWidth="1"
          />
        ))}

        <polygon
          points={pointsAttr(nearFace)}
          fill={FACE_FILL}
          stroke={LINE_COLOUR}
          strokeWidth="1.25"
        />

        {/* Mask just the hidden bottom edge with a background-coloured
            overlay, rather than splitting the outline into a polyline
            — keeps every other corner a single unbroken stroke. The
            mask is thinned to match the real outline weight and
            pulled in from both corner points, so a thicker/longer
            mask doesn't bleed onto the adjacent edges at the joints. */}
        {(() => {
          for (let i = 0; i < profile.length; i++) {
            const a = profile[i];
            const b = profile[(i + 1) % profile.length];
            if (a.y === 0 && b.y === 0) {
              const insetA = { x: a.x + (b.x - a.x) * 0.08, y: a.y + (b.y - a.y) * 0.08 };
              const insetB = { x: b.x + (a.x - b.x) * 0.08, y: b.y + (a.y - b.y) * 0.08 };
              const nearA = project(local3(insetA.x, insetA.y, 0), originX, originY);
              const nearB = project(local3(insetB.x, insetB.y, 0), originX, originY);
              return (
                <line
                  x1={nearA.x}
                  y1={nearA.y}
                  x2={nearB.x}
                  y2={nearB.y}
                  stroke={FACE_FILL}
                  strokeWidth="1.5"
                />
              );
            }
          }
          return null;
        })()}

        {/* Full far-end outline (every edge except the hidden
            bottom one), drawn solid at the same weight as everything
            else — the earlier dashed/faint version read as a
            duplicate ghost line; a properly-styled solid line just
            closes the shape correctly instead. */}
        {profile.map((a, i) => {
          const b = profile[(i + 1) % profile.length];
          if (a.y === 0 && b.y === 0) return null;

          const farA = project(local3(a.x, a.y, L), originX, originY);
          const farB = project(local3(b.x, b.y, L), originX, originY);
          return (
            <line
              key={`far-edge-${i}`}
              x1={farA.x}
              y1={farA.y}
              x2={farB.x}
              y2={farB.y}
              stroke={LINE_COLOUR}
              strokeWidth="1.25"
            />
          );
        })}

        {holePositions.map((xLocal, i) =>
          rowYLocals.map((yLocal, rowIndex) => {
            const outer = project(local3(yLocal, T, xLocal), originX, originY);
            const edge = project(local3(yLocal + 6, T, xLocal), originX, originY);
            const rx = Math.abs(edge.x - outer.x) || 4;
            const ry = rx * 0.5;
            const innerRx = rx * 0.55;
            const innerRy = ry * 0.55;
            const innerCentre = { x: outer.x, y: outer.y + ry * 0.35 };

            return (
              <g key={`hole-${i}-${rowIndex}`}>
                <ellipse
                  cx={outer.x}
                  cy={outer.y}
                  rx={rx}
                  ry={ry}
                  fill={FACE_FILL}
                  stroke={LINE_COLOUR}
                  strokeWidth="0.9"
                />
                <ellipse
                  cx={innerCentre.x}
                  cy={innerCentre.y}
                  rx={innerRx}
                  ry={innerRy}
                  fill="none"
                  stroke={LINE_COLOUR}
                  strokeWidth="0.75"
                />
                <line
                  x1={outer.x - rx * 0.85}
                  y1={outer.y - ry * 0.1}
                  x2={innerCentre.x - innerRx * 0.85}
                  y2={innerCentre.y - innerRy * 0.1}
                  stroke={LINE_COLOUR}
                  strokeWidth="0.6"
                />
                <line
                  x1={outer.x + rx * 0.85}
                  y1={outer.y - ry * 0.1}
                  x2={innerCentre.x + innerRx * 0.85}
                  y2={innerCentre.y - innerRy * 0.1}
                  stroke={LINE_COLOUR}
                  strokeWidth="0.6"
                />
              </g>
            );
          })
        )}

        {bevelStrips.map((s, i) => (
          <line
            key={`bevel-strip-${i}`}
            x1={s.p1.x}
            y1={s.p1.y}
            x2={s.p2.x}
            y2={s.p2.y}
            stroke={COATING_COLOUR}
            strokeWidth={s.widthPx}
            strokeLinecap="round"
          />
        ))}

        {leadingStrips.map((s, i) => (
          <line
            key={`leading-strip-${i}`}
            x1={s.p1.x}
            y1={s.p1.y}
            x2={s.p2.x}
            y2={s.p2.y}
            stroke={COATING_COLOUR}
            strokeWidth={s.widthPx}
            strokeLinecap="round"
          />
        ))}

        <g transform={`translate(${minX - 10}, ${maxY + 30})`}>
          <line x1="0" y1="0" x2="30" y2="0" stroke={COATING_COLOUR} strokeWidth="6" />
          <text x="38" y="4" fontSize="11" fill="#475569">
            Visible coating (bevel / leading edge)
          </text>
        </g>
      </svg>
    </div>
  );
}