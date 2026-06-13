"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useChartColors } from "@/lib/use-theme";

interface Point {
  label: string;
  nps: number | null;
  csat?: number | null;
}

export default function NpsEvolution({
  data,
  title,
}: {
  data: Point[];
  title?: string;
}) {
  const c = useChartColors();
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
      {title ? (
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          {title}
        </p>
      ) : null}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={c.axis}
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke={c.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[-100, 100]}
            />
            <Tooltip
              contentStyle={{
                background: c.tooltipBg,
                border: `1px solid ${c.tooltipBorder}`,
                fontSize: 12,
                color: c.tooltipText,
              }}
              labelStyle={{ color: c.tooltipLabel }}
            />
            <Line
              type="monotone"
              dataKey="nps"
              stroke={c.primary}
              strokeWidth={2.5}
              dot={{ r: 3, fill: c.primary }}
              name="NPS"
            />
            {data.some((d) => d.csat !== undefined) ? (
              <Line
                type="monotone"
                dataKey="csat"
                stroke={c.gold}
                strokeWidth={2}
                dot={{ r: 3, fill: c.gold }}
                name="CSAT"
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
