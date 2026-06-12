"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { QuestionType, SurveyType, SurveyQuestion } from "@/lib/types";
import { Trash2, Plus, ArrowUp, ArrowDown, Save } from "lucide-react";

interface BU {
  id: string;
  name: string;
  brand_type: string;
}
interface Product {
  id: string;
  name: string;
  business_unit_id: string;
}

interface ExistingSurvey {
  id: string;
  name: string;
  business_unit_id: string;
  product_id: string | null;
  audience: string | null;
  description: string | null;
  survey_type: SurveyType;
  is_active: boolean;
  slug: string;
  starts_at: string | null;
  ends_at: string | null;
}

interface Props {
  businessUnits: BU[];
  products: Product[];
  existingSurvey?: ExistingSurvey;
  existingQuestions?: SurveyQuestion[];
}

interface QDraft {
  tempId: string;
  id?: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  is_required: boolean;
  order_index: number;
}

const Q_TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: "nps_0_10", label: "NPS (0–10)", hint: "Indicação 0 a 10" },
  { value: "stars_1_5", label: "Estrelas (1–5)", hint: "Avaliação por estrelas" },
  { value: "csat_1_5", label: "CSAT (1–5)", hint: "Satisfação 1 a 5" },
  { value: "text", label: "Comentário livre", hint: "Texto longo" },
  { value: "multiple_choice", label: "Múltipla escolha", hint: "Escolha única" },
  { value: "yes_no", label: "Sim/Não", hint: "Binária" },
];

export default function SurveyEditor({
  businessUnits,
  products,
  existingSurvey,
  existingQuestions,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(existingSurvey?.name ?? "");
  const [buId, setBuId] = useState(
    existingSurvey?.business_unit_id ?? businessUnits[0]?.id ?? ""
  );
  const [productId, setProductId] = useState(
    existingSurvey?.product_id ?? ""
  );
  const [audience, setAudience] = useState(existingSurvey?.audience ?? "");
  const [description, setDescription] = useState(
    existingSurvey?.description ?? ""
  );
  const [surveyType, setSurveyType] = useState<SurveyType>(
    existingSurvey?.survey_type ?? "mixed"
  );
  const [isActive, setIsActive] = useState(existingSurvey?.is_active ?? true);
  const [slug, setSlug] = useState(existingSurvey?.slug ?? "");
  const [startsAt, setStartsAt] = useState(
    existingSurvey?.starts_at?.slice(0, 10) ?? ""
  );
  const [endsAt, setEndsAt] = useState(
    existingSurvey?.ends_at?.slice(0, 10) ?? ""
  );

  const [questions, setQuestions] = useState<QDraft[]>(() => {
    if (existingQuestions && existingQuestions.length > 0) {
      return existingQuestions
        .sort((a, b) => a.order_index - b.order_index)
        .map((q, i) => ({
          tempId: q.id,
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options ?? [],
          is_required: q.is_required,
          order_index: i,
        }));
    }
    return [
      {
        tempId: crypto.randomUUID(),
        question_text:
          "De 0 a 10, o quanto você indicaria o CPPEM para um amigo?",
        question_type: "nps_0_10",
        options: [],
        is_required: true,
        order_index: 0,
      },
      {
        tempId: crypto.randomUUID(),
        question_text:
          "O que mais te marcou na sua experiência? Conte para nós.",
        question_type: "text",
        options: [],
        is_required: false,
        order_index: 1,
      },
    ];
  });

  const filteredProducts = useMemo(
    () => products.filter((p) => p.business_unit_id === buId),
    [products, buId]
  );

  function addQuestion() {
    setQuestions((qs) => [
      ...qs,
      {
        tempId: crypto.randomUUID(),
        question_text: "",
        question_type: "text",
        options: [],
        is_required: true,
        order_index: qs.length,
      },
    ]);
  }

  function updateQ(idx: number, patch: Partial<QDraft>) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  }

  function removeQ(idx: number) {
    setQuestions((qs) =>
      qs.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order_index: i }))
    );
  }

  function move(idx: number, dir: -1 | 1) {
    setQuestions((qs) => {
      const next = [...qs];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return next;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((q, i) => ({ ...q, order_index: i }));
    });
  }

  function effectiveSlug() {
    const base = slug.trim() || slugify(name);
    return base.length > 0 ? base : `pesquisa-${Date.now()}`;
  }

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Defina o nome da pesquisa.");
    if (!buId) return setError("Selecione uma unidade de negócio.");
    if (questions.length === 0)
      return setError("Adicione ao menos uma pergunta.");
    for (const q of questions) {
      if (!q.question_text.trim())
        return setError("Todas as perguntas precisam de texto.");
      if (q.question_type === "multiple_choice" && q.options.length < 2)
        return setError(
          "Perguntas de múltipla escolha precisam de pelo menos 2 opções."
        );
    }

    startTransition(async () => {
      const supabase = createClient();

      const payload = {
        name: name.trim(),
        business_unit_id: buId,
        product_id: productId || null,
        audience: audience.trim() || null,
        description: description.trim() || null,
        survey_type: surveyType,
        is_active: isActive,
        slug: effectiveSlug(),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt + "T23:59:59").toISOString() : null,
      };

      let surveyId = existingSurvey?.id;

      if (surveyId) {
        const { error: upErr } = await supabase
          .from("surveys")
          .update(payload)
          .eq("id", surveyId);
        if (upErr) return setError(upErr.message);
        // Remove old questions and re-insert (simpler editor flow)
        await supabase
          .from("survey_questions")
          .delete()
          .eq("survey_id", surveyId);
      } else {
        const { data, error: insErr } = await supabase
          .from("surveys")
          .insert(payload)
          .select("id")
          .single();
        if (insErr || !data) return setError(insErr?.message ?? "Erro");
        surveyId = data.id;
      }

      const rows = questions.map((q, i) => ({
        survey_id: surveyId!,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options: q.question_type === "multiple_choice" ? q.options : null,
        scale_min: ["nps_0_10"].includes(q.question_type)
          ? 0
          : ["stars_1_5", "csat_1_5"].includes(q.question_type)
            ? 1
            : null,
        scale_max: q.question_type === "nps_0_10" ? 10 : ["stars_1_5", "csat_1_5"].includes(q.question_type) ? 5 : null,
        is_required: q.is_required,
        order_index: i,
      }));
      if (rows.length > 0) {
        const { error: qErr } = await supabase
          .from("survey_questions")
          .insert(rows);
        if (qErr) return setError(qErr.message);
      }

      router.push(`/admin/pesquisas/${surveyId}`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Identificação">
          <Field label="Nome da pesquisa">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Satisfação Turma 2026.1"
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
            />
          </Field>
          <Field label="Descrição curta (opcional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Texto curto que aparecerá para o respondente."
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Unidade de negócio">
              <select
                value={buId}
                onChange={(e) => {
                  setBuId(e.target.value);
                  setProductId("");
                }}
                className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
              >
                {businessUnits.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Produto / Curso (opcional)">
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
              >
                <option value="">— sem produto —</option>
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Público / Audiência">
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Ex.: Aluno, Pai, Responsável, Mentorado"
                className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
              />
            </Field>
            <Field label="Tipo da pesquisa">
              <select
                value={surveyType}
                onChange={(e) => setSurveyType(e.target.value as SurveyType)}
                className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
              >
                <option value="mixed">Mista</option>
                <option value="nps">NPS</option>
                <option value="csat">CSAT</option>
                <option value="stars">Estrelas</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Início (opcional)">
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
              />
            </Field>
            <Field label="Fim (opcional)">
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
              />
            </Field>
          </div>
          <Field label="Slug do link público (opcional)">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder={
                name ? slugify(name) : "gerado-automaticamente"
              }
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm font-mono outline-none focus:border-cppem-green"
            />
          </Field>
        </Card>

        <Card
          title="Perguntas"
          action={
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 rounded-md border border-ink-700 px-3 py-1.5 text-xs uppercase tracking-widest hover:border-cppem-green hover:text-cppem-green"
            >
              <Plus className="h-3.5 w-3.5" /> Pergunta
            </button>
          }
        >
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div
                key={q.tempId}
                className="rounded-md border border-ink-800 bg-ink-950/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cppem-green">
                    Pergunta {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <IconBtn
                      title="Subir"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      title="Descer"
                      onClick={() => move(i, 1)}
                      disabled={i === questions.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn title="Remover" onClick={() => removeQ(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
                <input
                  type="text"
                  value={q.question_text}
                  onChange={(e) =>
                    updateQ(i, { question_text: e.target.value })
                  }
                  placeholder="Texto da pergunta"
                  className="mb-3 w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col text-[11px] uppercase tracking-widest text-ink-400">
                    <span className="mb-1">Tipo</span>
                    <select
                      value={q.question_type}
                      onChange={(e) =>
                        updateQ(i, {
                          question_type: e.target.value as QuestionType,
                          options: [],
                        })
                      }
                      className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-cppem-green"
                    >
                      {Q_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-end gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={q.is_required}
                      onChange={(e) =>
                        updateQ(i, { is_required: e.target.checked })
                      }
                      className="h-4 w-4 accent-cppem-green"
                    />
                    Obrigatória
                  </label>
                </div>
                {q.question_type === "multiple_choice" ? (
                  <OptionsEditor
                    options={q.options}
                    onChange={(opts) => updateQ(i, { options: opts })}
                  />
                ) : null}
              </div>
            ))}
            {questions.length === 0 ? (
              <p className="text-sm text-ink-400">
                Adicione perguntas usando o botão acima.
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Status">
          <label className="flex items-center justify-between rounded-md border border-ink-800 bg-ink-950/40 px-4 py-3">
            <span className="text-sm">Pesquisa ativa</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-cppem-green"
            />
          </label>
          <p className="mt-2 text-xs text-ink-400">
            Pesquisas inativas não aceitam respostas via link público.
          </p>
        </Card>
        <Card title="Resumo">
          <ul className="space-y-1.5 text-xs text-ink-300">
            <li>
              <span className="text-ink-400">Slug:</span>{" "}
              <code className="rounded bg-ink-800 px-1.5 py-0.5">
                /{effectiveSlug()}
              </code>
            </li>
            <li>
              <span className="text-ink-400">Perguntas:</span>{" "}
              {questions.length}
            </li>
            <li>
              <span className="text-ink-400">Tipo:</span> {surveyType}
            </li>
          </ul>
        </Card>
        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}
        <button
          onClick={save}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-cppem-green py-3 text-sm font-bold uppercase tracking-widest text-cppem-black transition disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar pesquisa"}
        </button>
      </div>
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
          {title}
        </h2>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function IconBtn({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      type="button"
      className="grid h-7 w-7 place-items-center rounded-md border border-ink-700 text-ink-300 transition hover:border-cppem-green hover:text-cppem-green disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
        Opções
      </p>
      {options.map((o, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={o}
            onChange={(e) => {
              const next = [...options];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={`Opção ${i + 1}`}
            className="flex-1 rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-cppem-green"
          />
          <button
            type="button"
            onClick={() => onChange(options.filter((_, idx) => idx !== i))}
            className="grid h-9 w-9 place-items-center rounded-md border border-ink-700 text-ink-400 hover:border-rose-500 hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...options, ""])}
        className="flex items-center gap-2 rounded-md border border-ink-700 px-3 py-1.5 text-xs uppercase tracking-widest text-ink-300 hover:border-cppem-green hover:text-cppem-green"
      >
        <Plus className="h-3 w-3" /> Adicionar opção
      </button>
    </div>
  );
}
