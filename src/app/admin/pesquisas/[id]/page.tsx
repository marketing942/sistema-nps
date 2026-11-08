import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/page-header";
import KpiCard from "@/components/ui/kpi-card";
import { DistributionBars } from "@/components/charts/lazy";
import Pagination from "@/components/ui/pagination";
import { buildNpsDistribution } from "@/lib/nps";
import NpsGauge from "@/components/charts/nps-gauge";
import CopyLinkButton from "../copy-link-button";
import { ExternalLink, Pencil } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import SurveyEditorPanel from "./editor-panel";
import DeleteButton from "@/components/admin/delete-button";
import ResponsesList from "./responses-list";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface Props {
  params: { id: string };
  searchParams: { tab?: string; page?: string };
}

export default async function SurveyDetailPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const tab = searchParams.tab ?? "overview";
  const page = Math.max(1, Number(searchParams.page) || 1);

  // Pesquisa + perguntas numa só ida ao banco; o resto depende da aba aberta.
  const { data: survey } = await supabase
    .from("surveys")
    .select(
      `*, business_unit:business_units(id, name, brand_type),
       product:products(id, name),
       questions:survey_questions(*)`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!survey) notFound();

  const questions = [...((survey as any).questions ?? [])].sort(
    (a: any, b: any) => a.order_index - b.order_index
  );

  const from = (page - 1) * PAGE_SIZE;
  const [metricsRes, distRes, respRes, buRes, productsRes] = await Promise.all([
    tab === "overview"
      ? supabase
          .from("v_survey_metrics")
          .select("*")
          .eq("survey_id", survey.id)
          .maybeSingle()
      : null,
    tab === "overview"
      ? supabase.rpc("fn_nps_distribution", { p_survey: survey.id })
      : null,
    tab === "responses"
      ? supabase
          .from("survey_responses")
          .select(
            `id, submitted_at, respondent_name, respondent_email, respondent_phone, respondent_type,
             answers:survey_answers(
               id, numeric_value, text_value, choice_value,
               question:survey_questions(id, question_text, question_type, order_index, options)
             )`,
            { count: "exact" }
          )
          .eq("survey_id", survey.id)
          .order("submitted_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1)
      : null,
    tab === "editor"
      ? supabase.from("business_units").select("id, name, brand_type")
      : null,
    tab === "editor"
      ? supabase
          .from("products")
          .select("id, name, business_unit_id, is_active")
          .eq("is_active", true)
      : null,
  ]);

  const metrics = metricsRes?.data ?? null;
  const distribution = buildNpsDistribution(distRes?.data as any[]);
  const recentResponses = respRes?.data ?? [];
  const totalResponses = respRes?.count ?? 0;
  const bus = buRes?.data ?? [];
  const products = productsRes?.data ?? [];

  const bu = Array.isArray(survey.business_unit)
    ? survey.business_unit[0]
    : survey.business_unit;
  const product = Array.isArray(survey.product)
    ? survey.product?.[0]
    : survey.product;

  return (
    <>
      <PageHeader
        title={survey.name}
        description={`${bu?.name ?? ""}${product?.name ? " · " + product.name : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            <CopyLinkButton slug={survey.slug} variant="full" />
            <Link
              href={`/pesquisa/${survey.slug}`}
              target="_blank"
              className="flex items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-xs uppercase tracking-widest text-ink-300 hover:border-cppem-gold hover:text-cppem-gold"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir pesquisa
            </Link>
            <DeleteButton
              table="surveys"
              id={survey.id}
              label="Excluir pesquisa"
              variant="full"
              redirectTo="/admin/pesquisas"
              confirmText={`Excluir a pesquisa "${survey.name}"? Todas as perguntas e respostas serão removidas permanentemente.`}
            />
          </div>
        }
      />

      <div className="mb-6 flex gap-1 border-b border-ink-800">
        <TabLink
          href={`/admin/pesquisas/${survey.id}`}
          active={tab === "overview"}
        >
          Visão geral
        </TabLink>
        <TabLink
          href={`/admin/pesquisas/${survey.id}?tab=editor`}
          active={tab === "editor"}
        >
          Editar pesquisa
        </TabLink>
        <TabLink
          href={`/admin/pesquisas/${survey.id}?tab=responses`}
          active={tab === "responses"}
        >
          Respostas
        </TabLink>
      </div>

      {tab === "overview" ? (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NpsGauge
                value={metrics?.nps_score ?? null}
                title="Pontuação NPS desta pesquisa"
                totalResponses={Number(metrics?.nps_total ?? 0)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <KpiCard
                label="CSAT (%)"
                value={
                  metrics?.csat_score !== null &&
                  metrics?.csat_score !== undefined
                    ? `${metrics.csat_score}%`
                    : null
                }
                tone="good"
              />
              <KpiCard
                label="Estrelas (média)"
                value={
                  metrics?.average_stars
                    ? Number(metrics.average_stars).toFixed(2)
                    : null
                }
                tone="neutral"
              />
              <KpiCard
                label="Detratores"
                value={metrics?.detractors_count ?? 0}
                tone="bad"
              />
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <DistributionBars
              data={distribution}
              title="Distribuição das notas NPS"
            />
            <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
                Estrutura da pesquisa
              </p>
              <ol className="space-y-2">
                {(questions ?? []).map((q: any, i: number) => (
                  <li
                    key={q.id}
                    className="rounded-md border border-ink-800 bg-ink-950/40 px-3 py-2 text-sm"
                  >
                    <span className="mr-2 text-[10px] uppercase tracking-widest text-cppem-gold">
                      {i + 1}.
                    </span>
                    {q.question_text}
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-ink-400">
                      · {q.question_type}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </>
      ) : null}

      {tab === "editor" ? (
        <SurveyEditorPanel
          businessUnits={bus ?? []}
          products={products ?? []}
          survey={survey as any}
          questions={questions as any}
        />
      ) : null}

      {tab === "responses" ? (
        <ResponsesList
          responses={((recentResponses ?? []) as any[]).map((r) => ({
            id: r.id,
            submitted_at: r.submitted_at,
            respondent_name: r.respondent_name,
            respondent_email: r.respondent_email,
            respondent_phone: r.respondent_phone,
            respondent_type: r.respondent_type,
            answers: (r.answers ?? []).map((a: any) => ({
              id: a.id,
              numeric_value: a.numeric_value,
              text_value: a.text_value,
              choice_value: a.choice_value,
              question: Array.isArray(a.question)
                ? a.question[0]
                : a.question,
            })),
          }))}
          footer={
            <Pagination
              basePath={`/admin/pesquisas/${survey.id}`}
              params={{ tab: "responses" }}
              page={page}
              pageSize={PAGE_SIZE}
              total={totalResponses}
            />
          }
        />
      ) : null}
    </>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative px-4 py-3 text-xs uppercase tracking-widest transition ${
        active
          ? "text-cppem-gold"
          : "text-ink-400 hover:text-ink-100"
      }`}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-cppem-gold-solid" />
      ) : null}
    </Link>
  );
}
