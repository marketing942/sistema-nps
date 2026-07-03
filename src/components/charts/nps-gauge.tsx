"use client";

import { NPS_ZONES, npsLabel } from "@/lib/nps";

interface Props {
  value: number | null;
  title?: string;
  totalResponses?: number;
}

// Map NPS value (-100 to 100) to angle in degrees on a top semicircle.
// -100 -> 180° (left), 0 -> 90° (top), 100 -> 0° (right)
function valueToDeg(v: number): number {
  const clamped = Math.max(-100, Math.min(100, v));
  return 180 - ((clamped + 100) / 200) * 180;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

/**
 * Donut arc going from startDeg to endDeg through the TOP of the circle.
 * In SVG (Y axis down), traveling from left (180°) → top (90°) → right (0°)
 * is clockwise on screen, which means sweep-flag = 0 for the outer arc
 * and sweep-flag = 1 for the inner arc back.
 */
function donutArc(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startDeg: number,
  endDeg: number
): string {
  const p1 = polar(cx, cy, rOut, startDeg);
  const p2 = polar(cx, cy, rOut, endDeg);
  const p3 = polar(cx, cy, rIn, endDeg);
  const p4 = polar(cx, cy, rIn, startDeg);
  const largeArc = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
  // Sweep 0 on screen = counter-clockwise visually for SVG with Y down,
  // which is exactly what we need for the top semicircle (left → top → right).
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 1 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export default function NpsGauge({
  value,
  title = "Pontuação NPS",
  totalResponses,
}: Props) {
  // Generous viewBox with breathing room around the arc
  const W = 360;
  const H = 220;
  const cx = W / 2;
  const cy = H - 30;
  const rOut = 140;
  const rIn = 100;

  const hasValue = value !== null && Number.isFinite(Number(value));
  const numericValue = hasValue ? Number(value) : null;
  const needleAngle = hasValue ? valueToDeg(numericValue!) : 90;
  const label = npsLabel(numericValue);

  // Needle is a thin elongated triangle anchored at the center.
  const needleTip = polar(cx, cy, rIn + (rOut - rIn) / 2 + 18, needleAngle);
  const needleBaseL = polar(cx, cy, 9, needleAngle - 90);
  const needleBaseR = polar(cx, cy, 9, needleAngle + 90);

  const ticks = [-100, -75, -50, -25, 0, 25, 50, 75, 100];

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          {title}
        </p>
        {typeof totalResponses === "number" ? (
          <span className="text-[10px] uppercase tracking-widest text-ink-400">
            {totalResponses} respondentes NPS
          </span>
        ) : null}
      </div>

      <div className="flex flex-col items-center">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full max-w-md"
          role="img"
          aria-label={`Gauge NPS ${hasValue ? Math.round(numericValue!) : "sem dados"}`}
        >
          {/* Coloured zones */}
          {NPS_ZONES.map((z, i) => {
            const start = valueToDeg(z.min);
            const end = valueToDeg(z.max);
            return (
              <path
                key={i}
                d={donutArc(cx, cy, rOut, rIn, start, end)}
                fill={z.color}
                opacity={hasValue ? 0.95 : 0.4}
              />
            );
          })}

          {/* Tick marks + labels */}
          {ticks.map((t) => {
            const major = t % 50 === 0;
            const tickLen = major ? 8 : 4;
            const a = valueToDeg(t);
            const p1 = polar(cx, cy, rOut + 3, a);
            const p2 = polar(cx, cy, rOut + 3 + tickLen, a);
            return (
              <line
                key={`tick-${t}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="currentColor"
                className="text-ink-500"
                strokeWidth={1.2}
                strokeLinecap="round"
              />
            );
          })}
          {[-100, -50, 0, 50, 100].map((t) => {
            const a = valueToDeg(t);
            const lbl = polar(cx, cy, rOut + 22, a);
            return (
              <text
                key={`lbl-${t}`}
                x={lbl.x}
                y={lbl.y}
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current text-ink-300"
              >
                {t}
              </text>
            );
          })}

          {/* Needle */}
          {hasValue ? (
            <g>
              <polygon
                points={`${needleBaseL.x.toFixed(2)},${needleBaseL.y.toFixed(2)} ${needleTip.x.toFixed(2)},${needleTip.y.toFixed(2)} ${needleBaseR.x.toFixed(2)},${needleBaseR.y.toFixed(2)}`}
                className="fill-current text-ink-100"
              />
              <circle
                cx={cx}
                cy={cy}
                r={16}
                className="fill-current text-ink-800"
              />
              <circle
                cx={cx}
                cy={cy}
                r={9}
                className="fill-current text-ink-100"
              />
              <circle
                cx={cx}
                cy={cy}
                r={3.5}
                className="fill-current text-ink-800"
              />
            </g>
          ) : (
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={16}
                className="fill-current text-ink-800"
              />
              <circle
                cx={cx}
                cy={cy}
                r={6}
                className="fill-current text-ink-600"
              />
            </g>
          )}
        </svg>

        <div className="mt-1 text-center">
          <p
            className={`font-display text-5xl font-bold tabular-nums ${
              label.tone === "good"
                ? "text-emerald-500"
                : label.tone === "bad"
                  ? "text-rose-500"
                  : label.tone === "neutral"
                    ? "text-amber-500"
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
        <div className="mt-5 grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {NPS_ZONES.map((z) => (
            <div
              key={z.label}
              className="flex items-center gap-2 rounded-md border border-ink-800 bg-ink-950/50 px-2.5 py-1.5"
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
