"use client";

import dynamic from "next/dynamic";

// Recharts é a maior dependência do painel (~100 kB). Carregá-la sob demanda
// tira esse peso do bundle inicial; o skeleton evita "pulo" de layout.
function ChartSkeleton({ h }: { h: string }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
      <div className="mb-4 h-3 w-40 animate-pulse rounded bg-ink-800" />
      <div className={`${h} w-full animate-pulse rounded bg-ink-800/60`} />
    </div>
  );
}

export const NpsEvolution = dynamic(() => import("./nps-evolution"), {
  ssr: false,
  loading: () => <ChartSkeleton h="h-64" />,
});

export const DistributionBars = dynamic(() => import("./distribution-bars"), {
  ssr: false,
  loading: () => <ChartSkeleton h="h-56" />,
});
