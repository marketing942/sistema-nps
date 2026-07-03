import { createClient } from "@/lib/supabase/server";
import KpiCard from "@/components/ui/kpi-card";
import PageHeader from "@/components/ui/page-header";
import NpsEvolution from "@/components/charts/nps-evolution";
import DistributionBars from "@/components/charts/distribution-bars";
import NpsGauge from "@/components/charts/nps-gauge";
import { npsLabel, detectRisk } from "@/lib/nps";
import DashboardFilters from "./filters";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SearchParams {
  bu?: string;
  product?: string;
  from?: string;
  to?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const [{ data: bus }, { data: products }] = await Promise.all([
    supabase.from("business_units").select("id, name, slug, brand_type"),
    supabase
      .from("products")
      .select("id, name, business_unit_id, is_active")
      .eq("is_active", true),
  ]);

  // Resolve filters
  const buId = searchParams.bu || null;
  const productId = searchParams.product || null;
  const fromIso = searchParams.from
    ? new Date(searchParams.from).toISOString()
    : null;
  const toIso = searchParams.to
    ? new Date(searchParams.to + "T23:59:59").toISOString()
    : null;

  // Overview RPC
  const { data: overview } = await supabase.rpc("fn_metrics_overview", {
    p_business_unit: buId,
    p_product: productId,
    p_from: fromIso,
    p_to: toIso,
  });
  const m = (overview as any[])?.[0] ?? {};

  // NPS por respondente (1 voz por respondente)
  let npsQuery = supabase
    .from("v_response_nps")
    .select(
      "response_id, nps_score, classification, business_unit_id, product_id, submitted_at"
    );
  if (buId) npsQuery = npsQuery.eq("business_unit_id", buId);
  if (productId) npsQuery = npsQuery.eq("product_id", productId);
  if (fromIso) npsQuery = npsQuery.gte("submitted_at", fromIso);
  if (toIso) npsQuery = npsQuery.lte("submitted_at", toIso);
  const { data: npsResponses } = await npsQuery;

  const distribution = Array.from({ length: 11 }, (_, i) => ({
    label: String(i),
    value: (npsResponses ?? []).filter(
      (a: any) => Math.round(Number(a.nps_score)) === i
    ).length,
    color: i >= 9 ? "#10b981" : i >= 7 ? "#f59e0b" : "#ef4444",
  }));

  // Evolution — monthly buckets last 6 months (por respondente)
  const months = lastNMonths(6);
  const evolution = months.map((mo) => {
    const inMonth = (npsResponses ?? []).filter((a: any) => {
      const d = new Date(a.submitted_at);
      return d.getFullYear() === mo.year && d.getMonth() === mo.month;
    });
    const promoters = inMonth.filter(
      (a: any) => a.classification === "promoter"
    ).length;
    const detractors = inMonth.filter(
      (a: any) => a.classification === "detractor"
    ).length;
    const total = inMonth.length;
    return {
      label: mo.label,
      nps:
        total === 0 ? null : Math.round(((promoters - detractors) / total) * 100),
    };
  });

  // Ranking por pesquisa
  let surveyMetricsQuery = supabase
    .from("v_survey_metrics")
    .select(
      "survey_id, survey_name, business_unit_id, product_id, total_responses, nps_score, csat_score, average_stars"
    );
  if (buId) surveyMetricsQuery = surveyMetricsQuery.eq("business_unit_id", buId);
  if (productId) surveyMetricsQuery = surveyMetricsQuery.eq("product_id", productId);
  const { data: surveyMetrics } = await surveyMetricsQuery.order(
    "nps_score",
    { ascending: false, nullsFirst: false }
  );
  const ranked = (surveyMetrics ?? []).filter(
    (s: any) => s.total_responses > 0
  );
  const topRanked = ranked.slice(0, 5);
  const worstRanked = [...ranked]
    .filter((s: any) => s.nps_score !== null)
    .sort((a: any, b: any) => a.nps_score - b.nps_score)
    .slice(0, 5);

  // Comentários recentes
  let commentsQuery = supabase
    .from("v_answers_classified")
    .select(
      "answer_id, text_value, submitted_at, business_unit_id, product_id, survey_id"
    )
    .eq("question_type", "text")
    .not("text_value", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(8);
  if (buId) commentsQuery = commentsQuery.eq("business_unit_id", buId);
  if (productId) commentsQuery = commentsQuery.eq("product_id", productId);
  if (fromIso) commentsQuery = commentsQuery.gte("submitted_at", fromIso);
  if (toIso) commentsQuery = commentsQuery.lte("submitted_at", toIso);
  const { data: comments } = await commentsQuery;

  const npsValue = m.nps_score ?? null;
  const tone = npsLabel(npsValue);

  return (
    <>
      <PageHeader
        title="Visão geral da satisfação"
        description="Acompanhe NPS, CSAT, estrelas e comentários em tempo real, por unidade, produto e período."
      />
      <DashboardFilters
        businessUnits={bus ?? []}
        products={products ?? []}
        current={{
          bu: buId,
          product: productId,
          from: searchParams.from ?? null,
          to: searchParams.to ?? null,
        }}
      />

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NpsGauge
            value={npsValue}
            title="Pontuação NPS · zonas de classificação"
            totalResponses={Number(m.nps_total ?? 0)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <KpiCard
            label="CSAT geral (%)"
            value={
              m.csat_score !== null && m.csat_score !== undefined
                ? `${m.csat_score}%`
                : null
            }
            hint={
              m.csat_avg
                ? `Média ${Number(m.csat_avg).toFixed(2)} / 5 · ${m.csat_total ?? 0} respondentes`
                : "Sem respostas CSAT"
            }
            tone="good"
          />
          <KpiCard
            label="Média de estrelas"
            value={
              m.average_stars ? Number(m.average_stars).toFixed(2) : null
            }
            hint={
              m.stars_total
                ? `Escala 1 a 5 · ${m.stars_total} respondentes`
                : "Escala 1 a 5"
            }
            tone="neutral"
          />
          <KpiCard
            label="Total de respostas"
            value={m.total_responses ?? 0}
            hint={
              m.nps_total !== undefined && m.nps_total !== null
                ? `${m.nps_total} responderam à pergunta NPS`
                : "No período selecionado"
            }
          />
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Promotores"
          value={m.promoters ?? 0}
          hint={
            m.nps_total
              ? `de ${m.nps_total} respondentes NPS`
              : undefined
          }
          tone="good"
        />
        <KpiCard
          label="Neutros"
          value={m.neutrals ?? 0}
          hint={
            m.nps_total
              ? `de ${m.nps_total} respondentes NPS`
              : undefined
          }
          tone="neutral"
        />
        <KpiCard
          label="Detratores"
          value={m.detractors ?? 0}
          hint={
            m.nps_total
              ? `de ${m.nps_total} respondentes NPS`
              : undefined
          }
          tone="bad"
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <NpsEvolution data={evolution} title="Evolução do NPS (6 meses)" />
        <DistributionBars
          data={distribution}
          title="Distribuição das notas NPS (0 a 10)"
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <RankingCard title="Top 5 — Melhor NPS" items={topRanked} />
        <RankingCard
          title="Atenção — Pior NPS"
          items={worstRanked}
          tone="bad"
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <CommentsCard
          title="Últimos comentários"
          comments={(comments ?? []) as any[]}
        />
        <CommentsCard
          title="Comentários críticos"
          comments={(comments ?? []).filter((c: any) =>
            detectRisk(c.text_value)
          ) as any[]}
          tone="bad"
        />
      </section>
    </>
  );
}

function lastNMonths(n: number) {
  const out: { year: number; month: number; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("pt-BR", {
        month: "short",
      }),
    });
  }
  return out;
}

function RankingCard({
  title,
  items,
  tone = "good",
}: {
  title: string;
  items: any[];
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-ink-400">Sem pesquisas com dados.</p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Link
              key={s.survey_id}
              href={`/admin/pesquisas/${s.survey_id}`}
              className="flex items-center justify-between rounded-md border border-ink-800 bg-ink-950/50 px-4 py-3 transition hover:border-cppem-green/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{s.survey_name}</p>
                <p className="text-xs text-ink-400">
                  {s.total_responses} respostas
                </p>
              </div>
              <span
                className={`font-display text-2xl font-bold ${
                  tone === "good" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {s.nps_score ?? "—"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsCard({
  title,
  comments,
  tone = "neutral",
}: {
  title: string;
  comments: any[];
  tone?: "neutral" | "bad";
}) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        {title}
      </p>
      {comments.length === 0 ? (
        <p className="text-sm text-ink-400">Nenhum comentário ainda.</p>
      ) : (
        <div className="space-y-3">
          {comments.slice(0, 5).map((c: any) => (
            <div
              key={c.answer_id}
              className={`rounded-md border-l-2 bg-ink-950/50 px-4 py-3 ${
                tone === "bad"
                  ? "border-rose-400/60"
                  : "border-cppem-green/40"
              }`}
            >
              <p className="text-sm leading-relaxed">{c.text_value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-widest text-ink-400">
                {formatDateTime(c.submitted_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
