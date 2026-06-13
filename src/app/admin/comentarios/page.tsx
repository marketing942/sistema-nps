import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { detectRisk } from "@/lib/nps";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  bu?: string;
  survey?: string;
  category?: "all" | "risk" | "promoter" | "detractor" | "neutral";
}

export default async function ComentariosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const [{ data: bus }, { data: surveys }] = await Promise.all([
    supabase.from("business_units").select("id, name"),
    supabase.from("surveys").select("id, name"),
  ]);

  let query = supabase
    .from("v_answers_classified")
    .select(
      `answer_id, response_id, text_value, numeric_value, submitted_at, question_type, classification, survey_id, business_unit_id, product_id`
    )
    .eq("question_type", "text")
    .not("text_value", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(300);

  if (searchParams.bu) query = query.eq("business_unit_id", searchParams.bu);
  if (searchParams.survey) query = query.eq("survey_id", searchParams.survey);

  const { data: rows } = await query;

  // For each text answer, also fetch the score answer in the same response (NPS or stars)
  const responseIds = (rows ?? []).map((r: any) => r.response_id);
  let scoreMap = new Map<
    string,
    { score: number; classification: string | null; type: string }
  >();
  if (responseIds.length > 0) {
    const { data: scores } = await supabase
      .from("v_answers_classified")
      .select("response_id, numeric_value, classification, question_type")
      .in("response_id", responseIds)
      .in("question_type", ["nps_0_10", "stars_1_5", "csat_1_5"]);
    for (const s of scores ?? []) {
      if (!scoreMap.has(s.response_id))
        scoreMap.set(s.response_id, {
          score: Number(s.numeric_value),
          classification: s.classification,
          type: s.question_type,
        });
    }
  }

  const { data: surveyNames } = await supabase
    .from("surveys")
    .select("id, name");
  const surveyMap = new Map<string, string>(
    (surveyNames ?? []).map((s: any) => [s.id, s.name])
  );

  const category = searchParams.category ?? "all";
  let filtered = rows ?? [];
  if (category === "risk")
    filtered = filtered.filter((r: any) => detectRisk(r.text_value));
  else if (category === "detractor")
    filtered = filtered.filter(
      (r: any) =>
        scoreMap.get(r.response_id)?.classification === "detractor" ||
        scoreMap.get(r.response_id)?.classification === "unsatisfied"
    );
  else if (category === "promoter")
    filtered = filtered.filter(
      (r: any) =>
        scoreMap.get(r.response_id)?.classification === "promoter" ||
        scoreMap.get(r.response_id)?.classification === "satisfied"
    );
  else if (category === "neutral")
    filtered = filtered.filter(
      (r: any) =>
        scoreMap.get(r.response_id)?.classification === "neutral" ||
        scoreMap.get(r.response_id)?.classification === "csat_neutral"
    );

  const riskCount = (rows ?? []).filter((r: any) => detectRisk(r.text_value))
    .length;

  return (
    <>
      <PageHeader
        title="Comentários"
        description="Os comentários livres são a parte mais rica das pesquisas. Use os filtros para identificar elogios, reclamações e riscos de cancelamento."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink-400">
            <MessageSquare className="h-3.5 w-3.5" /> Total
          </div>
          <p className="mt-2 font-display text-3xl font-bold">
            {(rows ?? []).length}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" /> Comentários de risco
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-amber-300">
            {riskCount}
          </p>
        </div>
        <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
          <p className="text-xs uppercase tracking-widest text-ink-400">
            Categorias
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["all", "Todos"],
                ["promoter", "Promotores"],
                ["neutral", "Neutros"],
                ["detractor", "Detratores"],
                ["risk", "Risco"],
              ] as const
            ).map(([k, label]) => (
              <a
                key={k}
                href={mkLink({ ...searchParams, category: k })}
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest ${
                  category === k
                    ? "border-cppem-green text-cppem-green"
                    : "border-ink-700 text-ink-300 hover:border-cppem-green/40"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-ink-800 bg-ink-900 p-4">
        <input type="hidden" name="category" value={category} />
        <Select
          name="bu"
          label="Unidade"
          value={searchParams.bu ?? ""}
          options={[
            { value: "", label: "Todas" },
            ...(bus ?? []).map((b: any) => ({ value: b.id, label: b.name })),
          ]}
        />
        <Select
          name="survey"
          label="Pesquisa"
          value={searchParams.survey ?? ""}
          options={[
            { value: "", label: "Todas" },
            ...(surveys ?? []).map((s: any) => ({
              value: s.id,
              label: s.name,
            })),
          ]}
        />
        <button className="rounded-md border border-ink-700 px-3 py-2 text-xs uppercase tracking-widest text-ink-300 hover:border-cppem-green hover:text-cppem-green">
          Aplicar
        </button>
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum comentário no filtro atual"
          description="Tente ajustar os filtros ou aguarde novas respostas."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c: any) => {
            const risk = detectRisk(c.text_value);
            const score = scoreMap.get(c.response_id);
            return (
              <div
                key={c.answer_id}
                className={`rounded-xl border bg-ink-900 p-5 ${
                  risk
                    ? "border-rose-500/40 bg-rose-500/5"
                    : score?.classification === "promoter" ||
                        score?.classification === "satisfied"
                      ? "border-emerald-500/30"
                      : "border-ink-800"
                }`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
                  <span className="text-ink-400">
                    {formatDateTime(c.submitted_at)}
                  </span>
                  <span className="text-ink-400">·</span>
                  <span className="text-ink-300">
                    {surveyMap.get(c.survey_id) ?? "—"}
                  </span>
                  {score ? (
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        score.classification === "promoter" ||
                        score.classification === "satisfied"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : score.classification === "detractor" ||
                              score.classification === "unsatisfied"
                            ? "bg-rose-500/10 text-rose-300"
                            : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {score.type === "nps_0_10"
                        ? `NPS ${score.score}`
                        : score.type === "stars_1_5"
                          ? `${score.score}★`
                          : `CSAT ${score.score}`}
                    </span>
                  ) : null}
                  {risk ? (
                    <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-300">
                      <AlertTriangle className="h-3 w-3" /> Risco
                    </span>
                  ) : null}
                </div>
                <p className="text-[15px] leading-relaxed text-ink-100">
                  {c.text_value}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col text-[11px] uppercase tracking-widest text-ink-400">
      <span className="mb-1">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="min-w-[200px] rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-100 outline-none focus:border-cppem-green"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function mkLink(p: SearchParams) {
  const params = new URLSearchParams();
  if (p.bu) params.set("bu", p.bu);
  if (p.survey) params.set("survey", p.survey);
  if (p.category && p.category !== "all") params.set("category", p.category);
  const s = params.toString();
  return `/admin/comentarios${s ? `?${s}` : ""}`;
}
