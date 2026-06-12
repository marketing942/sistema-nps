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
            <CartesianGrid stroke="#1f1f29" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#6b6b7f"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#6b6b7f"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#101015",
                border: "1px solid #1f1f29",
                fontSize: 12,
              }}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color ?? "#00E63C"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
