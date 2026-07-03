import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/page-header";
import KpiCard from "@/components/ui/kpi-card";
import DistributionBars from "@/components/charts/distribution-bars";
import NpsGauge from "@/components/charts/nps-gauge";
import CopyLinkButton from "../copy-link-button";
import { ExternalLink, Pencil } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import SurveyEditorPanel from "./editor-panel";
import DeleteButton from "@/components/admin/delete-button";
import ResponsesList from "./responses-list";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
  searchParams: { tab?: string };
}

export default async function SurveyDetailPage({ params, searchParams }: Props) {
  const supabase = createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select(
      `*, business_unit:business_units(id, name, brand_type),
       product:products(id, name)`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!survey) notFound();

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("survey_id", survey.id)
    .order("order_index", { ascending: true });

  const { data: metrics } = await supabase
    .from("v_survey_metrics")
    .select("*")
    .eq("survey_id", survey.id)
    .maybeSingle();

  const { data: npsResponses } = await supabase
    .from("v_response_nps")
    .select("nps_score, classification")
    .eq("survey_id", survey.id);

  const distribution = Array.from({ length: 11 }, (_, i) => ({
    label: String(i),
    value: (npsResponses ?? []).filter(
      (a: any) => Math.round(Number(a.nps_score)) === i
    ).length,
    color: i >= 9 ? "#10b981" : i >= 7 ? "#f59e0b" : "#ef4444",
  }));

  const { data: recentResponses } = await supabase
    .from("survey_responses")
    .select(
      `id, submitted_at, respondent_name, respondent_email, respondent_phone, respondent_type,
       answers:survey_answers(
         id, numeric_value, text_value, choice_value,
         question:survey_questions(id, question_text, question_type, order_index, options)
       )`
    )
    .eq("survey_id", survey.id)
    .order("submitted_at", { ascending: false })
    .limit(200);

  const tab = searchParams.tab ?? "overview";
  const bu = Array.isArray(survey.business_unit)
    ? survey.business_unit[0]
    : survey.business_unit;
  const product = Array.isArray(survey.product)
    ? survey.product?.[0]
    : survey.product;

  const [{ data: bus }, { data: products }] = await Promise.all([
    supabase.from("business_units").select("id, name, brand_type"),
    supabase
      .from("products")
      .select("id, name, business_unit_id, is_active")
      .eq("is_active", true),
  ]);

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
              className="flex items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-xs uppercase tracking-widest text-ink-300 hover:border-cppem-green hover:text-cppem-green"
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
                    <span className="mr-2 text-[10px] uppercase tracking-widest text-cppem-green">
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
          questions={(questions as any) ?? []}
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
          ? "text-cppem-green"
          : "text-ink-400 hover:text-ink-100"
      }`}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-cppem-green" />
      ) : null}
    </Link>
  );
}
