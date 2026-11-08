import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const buRaw = searchParams.get("bu");
  const surveyRaw = searchParams.get("survey");
  const bu = buRaw && UUID_RE.test(buRaw) ? buRaw : null;
  const surveyId = surveyRaw && UUID_RE.test(surveyRaw) ? surveyRaw : null;

  // O PostgREST devolve no máximo 1000 linhas por requisição e uma URL com
  // centenas de ids em .in() estoura o limite de tamanho. Por isso: respostas
  // paginadas de 1000 em 1000 e answers buscadas em lotes pequenos.
  const PAGE = 1000;
  const responses: any[] = [];
  for (let from = 0; ; from += PAGE) {
    let respQ = supabase
      .from("survey_responses")
      .select(
        `id, submitted_at, respondent_name, respondent_email, respondent_phone, respondent_type, source,
         survey:surveys(name, slug),
         business_unit:business_units(name),
         product:products(name)`
      )
      .order("submitted_at", { ascending: false })
      .order("id")
      .range(from, from + PAGE - 1);
    if (bu) respQ = respQ.eq("business_unit_id", bu);
    if (surveyId) respQ = respQ.eq("survey_id", surveyId);
    const { data, error } = await respQ;
    if (error)
      return NextResponse.json({ error: "Falha ao exportar." }, { status: 500 });
    responses.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }

  if (responses.length === 0) {
    return new NextResponse("Nenhuma resposta para exportar.", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const ids = responses.map((r) => r.id);
  const CHUNK = 50;
  const CONCURRENCY = 5;
  const answers: any[] = [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const results = await Promise.all(
      chunks.slice(i, i + CONCURRENCY).map((chunk) =>
        supabase
          .from("survey_answers")
          .select(
            `response_id, numeric_value, text_value, choice_value,
             question:survey_questions(question_text, question_type, order_index)`
          )
          .in("response_id", chunk)
          .limit(5000)
      )
    );
    for (const r of results) {
      if (r.error)
        return NextResponse.json({ error: "Falha ao exportar." }, { status: 500 });
      answers.push(...(r.data ?? []));
    }
  }

  const grouped = new Map<string, any[]>();
  for (const a of answers) {
    const arr = grouped.get(a.response_id) ?? [];
    arr.push(a);
    grouped.set(a.response_id, arr);
  }

  const rows: string[] = [];
  rows.push(
    [
      "submitted_at",
      "business_unit",
      "product",
      "survey",
      "respondent_name",
      "respondent_email",
      "respondent_phone",
      "respondent_type",
      "source",
      "question",
      "question_type",
      "numeric_value",
      "text_value",
      "choice_value",
    ]
      .map(csv)
      .join(",")
  );

  for (const r of responses) {
    const ans = (grouped.get(r.id) ?? []).sort(
      (a: any, b: any) =>
        (a.question?.order_index ?? 0) - (b.question?.order_index ?? 0)
    );
    if (ans.length === 0) {
      rows.push(
        [
          r.submitted_at,
          getName(r.business_unit),
          getName(r.product),
          getName(r.survey),
          r.respondent_name,
          r.respondent_email,
          r.respondent_phone,
          r.respondent_type,
          r.source,
          "",
          "",
          "",
          "",
          "",
        ]
          .map(csv)
          .join(",")
      );
      continue;
    }
    for (const a of ans) {
      const q = Array.isArray(a.question) ? a.question[0] : a.question;
      rows.push(
        [
          r.submitted_at,
          getName(r.business_unit),
          getName(r.product),
          getName(r.survey),
          r.respondent_name,
          r.respondent_email,
          r.respondent_phone,
          r.respondent_type,
          r.source,
          q?.question_text ?? "",
          q?.question_type ?? "",
          a.numeric_value,
          a.text_value,
          a.choice_value,
        ]
          .map(csv)
          .join(",")
      );
    }
  }

  const body = "﻿" + rows.join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="respostas_${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}

function csv(v: any): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Prevent CSV/spreadsheet formula injection (CWE-1236):
  // valores começando com =, +, -, @, tab ou CR são prefixados com '
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  s = s.replace(/"/g, '""');
  if (s.includes(",") || s.includes("\n") || s.includes('"'))
    return `"${s}"`;
  return s;
}

function getName(x: any): string {
  if (!x) return "";
  if (Array.isArray(x)) return x[0]?.name ?? "";
  return x.name ?? "";
}
