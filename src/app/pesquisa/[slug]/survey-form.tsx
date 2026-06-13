"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SurveyQuestion } from "@/lib/types";
import { Star } from "lucide-react";

interface Props {
  surveyId: string;
  surveySlug: string;
  businessUnitId: string;
  productId: string | null;
  questions: SurveyQuestion[];
  brandType: "cppem" | "colegio";
}

type Answer = {
  numeric_value?: number | null;
  text_value?: string | null;
  choice_value?: string | null;
};

export default function SurveyForm({
  surveyId,
  surveySlug,
  businessUnitId,
  productId,
  questions,
  brandType,
}: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [respondentPhone, setRespondentPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setAnswer(qid: string, value: Answer) {
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...value } }));
  }

  function validate(): string | null {
    if (!respondentName.trim())
      return "Por favor, informe seu nome para enviar a resposta.";
    if (!respondentEmail.trim())
      return "Por favor, informe seu e-mail para enviar a resposta.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail.trim()))
      return "O e-mail informado parece inválido.";
    if (!respondentPhone.trim())
      return "Por favor, informe seu WhatsApp/telefone para enviar a resposta.";
    for (const q of questions) {
      if (!q.is_required) continue;
      const a = answers[q.id];
      if (!a) return `Responda: "${q.question_text}"`;
      if (
        ["nps_0_10", "stars_1_5", "csat_1_5"].includes(q.question_type) &&
        (a.numeric_value === undefined || a.numeric_value === null)
      )
        return `Responda: "${q.question_text}"`;
      if (q.question_type === "text" && !a.text_value?.trim())
        return `Responda: "${q.question_text}"`;
      if (q.question_type === "multiple_choice" && !a.choice_value)
        return `Responda: "${q.question_text}"`;
      if (q.question_type === "yes_no" && !a.choice_value)
        return `Responda: "${q.question_text}"`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    startTransition(async () => {
      const payload = {
        surveySlug,
        respondent: {
          name: respondentName,
          email: respondentEmail,
          phone: respondentPhone,
        },
        answers: questions
          .map((q) => {
            const a = answers[q.id];
            if (!a) return null;
            return {
              questionId: q.id,
              numeric_value: a.numeric_value ?? null,
              text_value: a.text_value ?? null,
              choice_value: a.choice_value ?? null,
            };
          })
          .filter(Boolean),
      };

      try {
        const res = await fetch("/api/survey/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(
            data?.error ?? "Não foi possível enviar sua resposta. Tente novamente."
          );
          return;
        }
        router.push(`/pesquisa/${surveySlug}/obrigado`);
      } catch {
        setError("Falha de rede. Verifique sua conexão e tente novamente.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {questions.map((q, idx) => (
        <div key={q.id} className="b-card-surface rounded-md p-5 sm:p-6">
          <div className="mb-3 flex items-start gap-2">
            <span className="b-primary-text mt-1 text-[11px] font-bold uppercase tracking-[0.18em]">
              Pergunta {idx + 1}
            </span>
            {q.is_required ? (
              <span className="text-[10px] uppercase tracking-wider opacity-60">
                · obrigatória
              </span>
            ) : null}
          </div>
          <p className="b-display mb-4 text-lg sm:text-xl font-semibold leading-snug">
            {q.question_text}
          </p>
          {renderQuestion(q, answers[q.id], (v) => setAnswer(q.id, v), brandType)}
        </div>
      ))}

      <div className="b-card-surface rounded-md p-5 sm:p-6">
        <p className="b-primary-text mb-1 text-[11px] font-bold uppercase tracking-[0.18em]">
          Identificação <span className="opacity-70">· obrigatória</span>
        </p>
        <p className="b-muted mb-4 text-xs">
          Precisamos saber quem está respondendo para conseguir conversar com
          você caso necessário.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            required
            placeholder="Seu nome completo *"
            value={respondentName}
            onChange={(e) => setRespondentName(e.target.value)}
            className="b-border rounded-md border bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-current sm:col-span-2"
          />
          <input
            type="email"
            required
            placeholder="E-mail *"
            value={respondentEmail}
            onChange={(e) => setRespondentEmail(e.target.value)}
            className="b-border rounded-md border bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-current"
          />
          <input
            type="tel"
            required
            placeholder="WhatsApp / Telefone *"
            value={respondentPhone}
            onChange={(e) => setRespondentPhone(e.target.value)}
            className="b-border rounded-md border bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-current"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="b-primary-bg b-display w-full rounded-md py-3.5 text-lg font-bold uppercase tracking-[0.15em] transition disabled:opacity-60"
      >
        {isPending ? "Enviando..." : "Enviar resposta"}
      </button>
    </form>
  );
}

function renderQuestion(
  q: SurveyQuestion,
  ans: Answer | undefined,
  set: (v: Answer) => void,
  brand: "cppem" | "colegio"
) {
  switch (q.question_type) {
    case "nps_0_10":
      return <NpsScale value={ans?.numeric_value ?? null} onChange={(v) => set({ numeric_value: v })} />;
    case "stars_1_5":
      return <Stars value={ans?.numeric_value ?? null} onChange={(v) => set({ numeric_value: v })} />;
    case "csat_1_5":
      return <CsatScale value={ans?.numeric_value ?? null} onChange={(v) => set({ numeric_value: v })} />;
    case "yes_no":
      return (
        <div className="flex gap-3">
          {[
            { v: "sim", label: "Sim" },
            { v: "nao", label: "Não" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => set({ choice_value: o.v })}
              className={`flex-1 rounded-md border px-4 py-3 text-sm font-semibold uppercase tracking-wider transition ${
                ans?.choice_value === o.v
                  ? "b-primary-bg border-transparent"
                  : "b-border opacity-80 hover:opacity-100"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      );
    case "multiple_choice":
      return (
        <div className="grid gap-2">
          {(q.options ?? []).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => set({ choice_value: o })}
              className={`rounded-md border px-4 py-3 text-left text-sm transition ${
                ans?.choice_value === o
                  ? "b-primary-bg border-transparent"
                  : "b-border hover:opacity-90"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      );
    case "text":
    default:
      return (
        <textarea
          rows={4}
          value={ans?.text_value ?? ""}
          onChange={(e) => set({ text_value: e.target.value })}
          placeholder="Escreva sua resposta aqui..."
          className="b-border w-full rounded-md border bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-current"
        />
      );
  }
}

function NpsScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-11 gap-1.5">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`b-border aspect-square rounded-md border text-sm font-bold transition ${
              value === n ? "b-primary-bg border-transparent" : "hover:opacity-80"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="b-muted mt-2 flex justify-between text-[11px] uppercase tracking-wider">
        <span>Pouco provável</span>
        <span>Muito provável</span>
      </div>
    </div>
  );
}

function Stars({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition hover:scale-110"
          aria-label={`${n} estrelas`}
        >
          <Star
            className={`h-9 w-9 ${
              value !== null && value >= n
                ? "b-primary-text fill-current"
                : "opacity-30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function CsatScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const labels = ["Muito insatisfeito", "Insatisfeito", "Neutro", "Satisfeito", "Muito satisfeito"];
  return (
    <div className="grid grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map((n, i) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`b-border flex flex-col items-center gap-1 rounded-md border px-2 py-3 transition ${
            value === n ? "b-primary-bg border-transparent" : "hover:opacity-80"
          }`}
        >
          <span className="text-lg font-bold">{n}</span>
          <span className="text-[10px] uppercase tracking-wider leading-tight text-center">
            {labels[i]}
          </span>
        </button>
      ))}
    </div>
  );
}
