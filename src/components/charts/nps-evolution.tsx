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
              domain={[-100, 100]}
            />
            <Tooltip
              contentStyle={{
                background: "#101015",
                border: "1px solid #1f1f29",
                fontSize: 12,
              }}
              labelStyle={{ color: "#a1a1b3" }}
            />
            <Line
              type="monotone"
              dataKey="nps"
              stroke="#00E63C"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#00E63C" }}
              name="NPS"
            />
            {data.some((d) => d.csat !== undefined) ? (
              <Line
                type="monotone"
                dataKey="csat"
                stroke="#C9A227"
                strokeWidth={2}
                dot={{ r: 3, fill: "#C9A227" }}
                name="CSAT"
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
