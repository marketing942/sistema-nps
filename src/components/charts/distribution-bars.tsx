"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useChartColors } from "@/lib/use-theme";

export interface DistItem {
  label: string;
  value: number;
  color?: string;
}

export default function DistributionBars({
  data,
  title,
}: {
  data: DistItem[];
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
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: c.tooltipBg,
                border: `1px solid ${c.tooltipBorder}`,
                fontSize: 12,
                color: c.tooltipText,
              }}
              cursor={{ fill: "rgba(120,120,140,0.06)" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color ?? c.primary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
