"use client";

import { useMemo, useState } from "react";
import {
  Star,
  Mail,
  Phone,
  User,
  MessageSquareQuote,
  Search,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { classifyNps, classifyStars, classifyCsat, detectRisk } from "@/lib/nps";
import DeleteButton from "@/components/admin/delete-button";
import type { QuestionType } from "@/lib/types";

interface Answer {
  id: string;
  numeric_value: number | null;
  text_value: string | null;
  choice_value: string | null;
  question: {
    id: string;
    question_text: string;
    question_type: QuestionType;
    order_index: number;
    options: string[] | null;
  } | null;
}

interface Response {
  id: string;
  submitted_at: string;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_phone: string | null;
  respondent_type: string | null;
  answers: Answer[];
}

const TYPE_LABELS: Record<QuestionType, string> = {
  nps_0_10: "NPS · 0 a 10",
  stars_1_5: "Estrelas · 1 a 5",
  csat_1_5: "CSAT · 1 a 5",
  text: "Comentário livre",
  multiple_choice: "Múltipla escolha",
  yes_no: "Sim / Não",
};

type FilterKey = "all" | "promoter" | "neutral" | "detractor" | "risk";

export default function ResponsesList({ responses }: { responses: Response[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    let list = responses;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const inHeader =
          (r.respondent_name ?? "").toLowerCase().includes(q) ||
          (r.respondent_email ?? "").toLowerCase().includes(q) ||
          (r.respondent_phone ?? "").toLowerCase().includes(q);
        const inComments = r.answers.some((a) =>
          (a.text_value ?? "").toLowerCase().includes(q)
        );
        return inHeader || inComments;
      });
    }
    if (filter !== "all") {
      list = list.filter((r) => {
        const summary = summarize(r);
        if (filter === "risk") {
          return r.answers.some((a) => detectRisk(a.text_value));
        }
        return summary.category === filter;
      });
    }
    return list;
  }, [responses, search, filter]);

  const counters = useMemo(() => {
    const c = { all: responses.length, promoter: 0, neutral: 0, detractor: 0, risk: 0 };
    for (const r of responses) {
      const s = summarize(r);
      if (s.category === "promoter") c.promoter++;
      else if (s.category === "detractor") c.detractor++;
      else if (s.category === "neutral") c.neutral++;
      if (r.answers.some((a) => detectRisk(a.text_value))) c.risk++;
    }
    return c;
  }, [responses]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-ink-800 bg-ink-900 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou comentário..."
            className="w-full rounded-md border border-ink-700 bg-ink-800 py-2.5 pl-9 pr-3 text-sm text-ink-100 outline-none focus:border-cppem-green"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", `Todos (${counters.all})`, "ink"],
              ["promoter", `Promotores (${counters.promoter})`, "good"],
              ["neutral", `Neutros (${counters.neutral})`, "neutral"],
              ["detractor", `Detratores (${counters.detractor})`, "bad"],
              ["risk", `Risco (${counters.risk})`, "bad"],
            ] as [FilterKey, string, string][]
          ).map(([k, label, tone]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest transition ${
                filter === k
                  ? tone === "good"
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                    : tone === "bad"
                      ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                      : tone === "neutral"
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                        : "border-cppem-green text-cppem-green"
                  : "border-ink-700 text-ink-300 hover:border-ink-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-800 bg-ink-900/40 p-10 text-center">
          <p className="text-sm text-ink-400">
            {responses.length === 0
              ? "Nenhuma resposta ainda. Compartilhe o link público."
              : "Nenhuma resposta encontrada com os filtros atuais."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <ResponseCard key={r.id} response={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResponseCard({ response }: { response: Response }) {
  const summary = summarize(response);
  const sortedAnswers = [...response.answers].sort(
    (a, b) => (a.question?.order_index ?? 0) - (b.question?.order_index ?? 0)
  );
  const hasRiskComment = response.answers.some((a) => detectRisk(a.text_value));

  return (
    <article className="overflow-hidden rounded-xl border border-ink-800 bg-ink-900">
      <header className="flex flex-col gap-3 border-b border-ink-800 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink-700 bg-ink-950 text-ink-300">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">
                {response.respondent_name || "Anônimo"}
              </p>
              {summary.badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${summary.badgeClass}`}
                >
                  {summary.badge}
                </span>
              ) : null}
              {hasRiskComment ? (
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-300">
                  Risco
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-ink-400">
              {formatDateTime(response.submitted_at)}
              {response.respondent_type
                ? ` · ${response.respondent_type}`
                : ""}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-300">
              {response.respondent_email ? (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-ink-400" />
                  {response.respondent_email}
                </span>
              ) : null}
              {response.respondent_phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-ink-400" />
                  {response.respondent_phone}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <DeleteButton
            table="survey_responses"
            id={response.id}
            label="Excluir resposta"
            confirmText="Excluir esta resposta? Esta ação não pode ser desfeita."
          />
        </div>
      </header>

      <div className="divide-y divide-ink-800">
        {sortedAnswers.map((a, i) => (
          <AnswerRow key={a.id ?? i} answer={a} index={i} />
        ))}
        {sortedAnswers.length === 0 ? (
          <div className="p-5 text-sm text-ink-400">
            Este respondente não deixou respostas gravadas.
          </div>
        ) : null}
      </div>
    </article>
  );
}

function AnswerRow({ answer, index }: { answer: Answer; index: number }) {
  const q = answer.question;
  if (!q) return null;
  return (
    <div className="p-5">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink-400">
        <span className="text-cppem-green">Q{index + 1}</span>
        <span>·</span>
        <span>{TYPE_LABELS[q.question_type]}</span>
      </div>
      <p className="mb-3 text-[15px] font-semibold leading-snug text-ink-100">
        {q.question_text}
      </p>
      <div>{renderAnswer(answer, q)}</div>
    </div>
  );
}

function renderAnswer(a: Answer, q: NonNullable<Answer["question"]>) {
  switch (q.question_type) {
    case "nps_0_10": {
      const v = a.numeric_value;
      if (v === null || v === undefined) return <Empty />;
      const cat = classifyNps(Number(v));
      const meta =
        cat === "promoter"
          ? { label: "Promotor", cls: "bg-emerald-500/15 text-emerald-300" }
          : cat === "neutral"
            ? { label: "Neutro", cls: "bg-amber-500/15 text-amber-300" }
            : { label: "Detrator", cls: "bg-rose-500/15 text-rose-300" };
      return (
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-lg border border-ink-800 bg-ink-950 font-display text-3xl font-bold tabular-nums">
            {v}
          </div>
          <div>
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${meta.cls}`}
            >
              {meta.label}
            </span>
            <p className="mt-1 text-xs text-ink-400">Nota de 0 a 10</p>
          </div>
        </div>
      );
    }
    case "stars_1_5": {
      const v = Math.round(Number(a.numeric_value ?? 0));
      if (!v) return <Empty />;
      const cat = classifyStars(v);
      const meta =
        cat === "promoter"
          ? { cls: "text-emerald-300", label: "Promotor" }
          : cat === "neutral"
            ? { cls: "text-amber-300", label: "Neutro" }
            : { cls: "text-rose-300", label: "Detrator" };
      return (
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-6 w-6 ${
                  n <= v ? "fill-amber-400 text-amber-400" : "text-ink-700"
                }`}
              />
            ))}
          </div>
          <div>
            <p className={`text-sm font-bold ${meta.cls}`}>
              {v} de 5 estrelas · {meta.label}
            </p>
          </div>
        </div>
      );
    }
    case "csat_1_5": {
      const v = Math.round(Number(a.numeric_value ?? 0));
      if (!v) return <Empty />;
      const cat = classifyCsat(v);
      const labels = [
        "Muito insatisfeito",
        "Insatisfeito",
        "Neutro",
        "Satisfeito",
        "Muito satisfeito",
      ];
      const meta =
        cat === "satisfied"
          ? { cls: "bg-emerald-500/15 text-emerald-300" }
          : cat === "neutral"
            ? { cls: "bg-amber-500/15 text-amber-300" }
            : { cls: "bg-rose-500/15 text-rose-300" };
      return (
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-lg border border-ink-800 bg-ink-950 font-display text-3xl font-bold tabular-nums">
            {v}
          </div>
          <div>
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${meta.cls}`}
            >
              {labels[v - 1]}
            </span>
            <p className="mt-1 text-xs text-ink-400">Escala CSAT 1 a 5</p>
          </div>
        </div>
      );
    }
    case "text": {
      const text = a.text_value?.trim();
      if (!text) return <Empty />;
      const risky = detectRisk(text);
      return (
        <div
          className={`relative rounded-md border-l-2 p-4 ${
            risky
              ? "border-rose-500/60 bg-rose-500/5"
              : "border-cppem-green/50 bg-ink-950/40"
          }`}
        >
          <MessageSquareQuote
            className={`absolute -top-2 left-3 h-4 w-4 ${
              risky ? "text-rose-400" : "text-cppem-green"
            }`}
          />
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-100">
            {text}
          </p>
        </div>
      );
    }
    case "yes_no": {
      const choice = (a.choice_value ?? "").toLowerCase();
      if (!choice) return <Empty />;
      const yes = choice === "sim";
      return (
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${
            yes
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-rose-500/15 text-rose-300"
          }`}
        >
          {yes ? "Sim" : "Não"}
        </span>
      );
    }
    case "multiple_choice": {
      const choice = a.choice_value;
      if (!choice) return <Empty />;
      return (
        <div>
          <span className="inline-block rounded-md border border-cppem-green/40 bg-cppem-green/10 px-3 py-1.5 text-sm font-semibold text-cppem-green">
            {choice}
          </span>
          {q.options?.length ? (
            <p className="mt-2 text-[11px] text-ink-400">
              De {q.options.length} opções disponíveis
            </p>
          ) : null}
        </div>
      );
    }
    default:
      return <Empty />;
  }
}

function Empty() {
  return <span className="text-sm italic text-ink-400">Sem resposta</span>;
}

/**
 * Determina uma categoria "principal" do respondente para filtros.
 * Prioriza NPS; se não houver, olha para estrelas e depois CSAT.
 */
function summarize(r: Response): {
  category: "promoter" | "neutral" | "detractor" | null;
  badge: string | null;
  badgeClass: string;
} {
  const nps = r.answers.find(
    (a) => a.question?.question_type === "nps_0_10"
  );
  if (nps?.numeric_value !== null && nps?.numeric_value !== undefined) {
    const cat = classifyNps(Number(nps.numeric_value));
    return {
      category: cat,
      badge: `NPS ${nps.numeric_value}`,
      badgeClass:
        cat === "promoter"
          ? "bg-emerald-500/15 text-emerald-300"
          : cat === "detractor"
            ? "bg-rose-500/15 text-rose-300"
            : "bg-amber-500/15 text-amber-300",
    };
  }
  const stars = r.answers.find(
    (a) => a.question?.question_type === "stars_1_5"
  );
  if (stars?.numeric_value !== null && stars?.numeric_value !== undefined) {
    const cat = classifyStars(Number(stars.numeric_value));
    return {
      category: cat,
      badge: `${stars.numeric_value}★`,
      badgeClass:
        cat === "promoter"
          ? "bg-emerald-500/15 text-emerald-300"
          : cat === "detractor"
            ? "bg-rose-500/15 text-rose-300"
            : "bg-amber-500/15 text-amber-300",
    };
  }
  const csat = r.answers.find(
    (a) => a.question?.question_type === "csat_1_5"
  );
  if (csat?.numeric_value !== null && csat?.numeric_value !== undefined) {
    const v = Number(csat.numeric_value);
    const cat = classifyCsat(v);
    const map = {
      satisfied: "promoter",
      neutral: "neutral",
      unsatisfied: "detractor",
    } as const;
    return {
      category: map[cat],
      badge: `CSAT ${v}`,
      badgeClass:
        cat === "satisfied"
          ? "bg-emerald-500/15 text-emerald-300"
          : cat === "unsatisfied"
            ? "bg-rose-500/15 text-rose-300"
            : "bg-amber-500/15 text-amber-300",
    };
  }
  return { category: null, badge: null, badgeClass: "" };
}
