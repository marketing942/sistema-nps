"use client";

import { NPS_ZONES, npsLabel } from "@/lib/nps";

interface Props {
  value: number | null;
  title?: string;
  totalResponses?: number;
}

// Map NPS value (-100 to 100) to angle in degrees on a top semicircle.
// -100 -> 180°, 0 -> 90°, 100 -> 0°
function valueToDeg(v: number): number {
  const clamped = Math.max(-100, Math.min(100, v));
  return 180 - ((clamped + 100) / 200) * 180;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function donutArc(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startDeg: number,
  endDeg: number
): string {
  // We always draw start -> end (start > end since left=180, right=0)
  const p1 = polar(cx, cy, rOut, startDeg);
  const p2 = polar(cx, cy, rOut, endDeg);
  const p3 = polar(cx, cy, rIn, endDeg);
  const p4 = polar(cx, cy, rIn, startDeg);
  const largeArc = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 ${largeArc} 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 ${largeArc} 1 ${p4.x} ${p4.y} Z`;
}

export default function NpsGauge({
  value,
  title = "Pontuação NPS",
  totalResponses,
}: Props) {
  const W = 360;
  const H = 220;
  const cx = W / 2;
  const cy = H - 30;
  const rOut = 140;
  const rIn = 90;

  const hasValue = value !== null && Number.isFinite(Number(value));
  const numericValue = hasValue ? Number(value) : null;
  const needleAngle = hasValue ? valueToDeg(numericValue!) : 90;
  const label = npsLabel(numericValue);

  const needleTip = polar(cx, cy, rOut - 8, needleAngle);
  const needleBaseL = polar(cx, cy, 14, needleAngle - 90);
  const needleBaseR = polar(cx, cy, 14, needleAngle + 90);

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          {title}
        </p>
        {typeof totalResponses === "number" ? (
          <span className="text-[10px] uppercase tracking-widest text-ink-400">
            {totalResponses} respostas
          </span>
        ) : null}
      </div>

      <div className="flex flex-col items-center">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full max-w-md"
          role="img"
          aria-label={`Gauge NPS ${hasValue ? numericValue : "sem dados"}`}
        >
          {/* Zones */}
          {NPS_ZONES.map((z, i) => {
            const start = valueToDeg(z.min);
            const end = valueToDeg(z.max);
            return (
              <path
                key={i}
                d={donutArc(cx, cy, rOut, rIn, start, end)}
                fill={z.color}
                opacity={hasValue ? 0.95 : 0.35}
              />
            );
          })}

          {/* Ticks */}
          {[-100, -50, 0, 50, 75, 100].map((t) => {
            const p1 = polar(cx, cy, rOut + 4, valueToDeg(t));
            const p2 = polar(cx, cy, rOut + 14, valueToDeg(t));
            const lbl = polar(cx, cy, rOut + 26, valueToDeg(t));
            return (
              <g key={t}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="currentColor"
                  className="text-ink-400"
                  strokeWidth={1}
                />
                <text
                  x={lbl.x}
                  y={lbl.y}
                  fontSize={10}
                  textAnchor="middle"
                  className="fill-current text-ink-400"
                  dominantBaseline="middle"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Needle */}
          {hasValue ? (
            <>
              <polygon
                points={`${needleBaseL.x},${needleBaseL.y} ${needleTip.x},${needleTip.y} ${needleBaseR.x},${needleBaseR.y}`}
                className="fill-current text-ink-100"
                opacity={0.85}
              />
              <circle
                cx={cx}
                cy={cy}
                r={14}
                className="fill-current text-ink-800"
              />
              <circle
                cx={cx}
                cy={cy}
                r={6}
                className="fill-current text-ink-100"
              />
            </>
          ) : (
            <circle
              cx={cx}
              cy={cy}
              r={14}
              className="fill-current text-ink-700"
            />
          )}
        </svg>

        <div className="mt-2 text-center">
          <p
            className={`font-display text-5xl font-bold tabular-nums ${
              label.tone === "good"
                ? "text-emerald-400"
                : label.tone === "bad"
                  ? "text-rose-400"
                  : label.tone === "neutral"
                    ? "text-amber-400"
                    : "text-ink-400"
            }`}
          >
            {hasValue ? Math.round(numericValue!) : "—"}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
            {label.label}
          </p>
        </div>

        {/* Legend */}
        <div className="mt-4 grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {NPS_ZONES.map((z) => (
            <div
              key={z.label}
              className="flex items-center gap-2 rounded-md border border-ink-800 bg-ink-950/50 px-2 py-1.5"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: z.color }}
              />
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-ink-200">
                  {z.label.replace("Zona de ", "").replace("Zona ", "")}
                </p>
                <p className="text-[10px] text-ink-400">
                  {z.min} a {z.max}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
