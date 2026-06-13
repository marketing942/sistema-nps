import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp, cleanupBuckets } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT = 4000;
const MAX_NAME = 200;
const MAX_PHONE = 30;
const MAX_ANSWERS_PER_REQUEST = 50;

type AnswerInput = {
  questionId?: unknown;
  numeric_value?: unknown;
  text_value?: unknown;
  choice_value?: unknown;
};

function str(v: unknown, max: number): string {
  if (v === null || v === undefined) return "";
  return String(v).slice(0, max);
}

function int(v: unknown): number | null {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return null;
  return n;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  cleanupBuckets();

  const ip = getClientIp(req.headers);
  // 10 envios / 10 min / IP
  const rl = rateLimit(`submit:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error:
          "Muitas respostas enviadas deste dispositivo. Tente novamente em alguns minutos.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.resetIn / 1000)),
        },
      }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("Payload inválido.");
  }

  const surveySlug = str(body?.surveySlug, 120).trim().toLowerCase();
  if (!surveySlug || !/^[a-z0-9-]{1,120}$/.test(surveySlug)) {
    return bad("Pesquisa inválida.");
  }

  const respondent = body?.respondent ?? {};
  const name = str(respondent.name, MAX_NAME).trim();
  const email = str(respondent.email, MAX_NAME).trim().toLowerCase();
  const phoneRaw = str(respondent.phone, MAX_PHONE).trim();
  const phoneDigits = phoneRaw.replace(/\D/g, "");

  if (name.length < 2) return bad("Informe seu nome.");
  if (!EMAIL_RE.test(email)) return bad("E-mail inválido.");
  if (phoneDigits.length < 8 || phoneDigits.length > 15)
    return bad("Telefone inválido.");

  const answersIn: AnswerInput[] = Array.isArray(body?.answers)
    ? body.answers.slice(0, MAX_ANSWERS_PER_REQUEST)
    : [];

  const supabase = createAdminClient();

  // 1. Resolve survey (must be active and within optional window)
  const { data: survey, error: sErr } = await supabase
    .from("surveys")
    .select(
      "id, slug, is_active, business_unit_id, product_id, starts_at, ends_at"
    )
    .eq("slug", surveySlug)
    .maybeSingle();
  if (sErr) return bad("Erro ao localizar pesquisa.", 500);
  if (!survey || !survey.is_active) return bad("Pesquisa indisponível.", 404);

  const now = Date.now();
  if (survey.starts_at && new Date(survey.starts_at).getTime() > now)
    return bad("Pesquisa ainda não iniciou.", 403);
  if (survey.ends_at && new Date(survey.ends_at).getTime() < now)
    return bad("Pesquisa encerrada.", 403);

  // 2. Load survey questions
  const { data: questions, error: qErr } = await supabase
    .from("survey_questions")
    .select("id, question_type, options, is_required, question_text")
    .eq("survey_id", survey.id);
  if (qErr) return bad("Erro ao carregar perguntas.", 500);
  const questionMap = new Map<string, any>(
    (questions ?? []).map((q) => [q.id, q])
  );

  // 3. Validate required questions are answered and ranges are valid
  const validRows: any[] = [];

  for (const q of questions ?? []) {
    if (!q.is_required) continue;
    const provided = answersIn.find((a) => a.questionId === q.id);
    if (!provided)
      return bad(`Responda a pergunta obrigatória: "${q.question_text}"`);
  }

  for (const a of answersIn) {
    const qid = str(a.questionId, 64);
    const q = questionMap.get(qid);
    if (!q) continue; // ignore unknown / cross-survey ids defensively

    switch (q.question_type) {
      case "nps_0_10": {
        const v = int(a.numeric_value);
        if (v === null || v < 0 || v > 10)
          return bad(`Valor inválido para "${q.question_text}" (0 a 10).`);
        validRows.push({ question_id: q.id, numeric_value: v });
        break;
      }
      case "stars_1_5":
      case "csat_1_5": {
        const v = int(a.numeric_value);
        if (v === null || v < 1 || v > 5)
          return bad(`Valor inválido para "${q.question_text}" (1 a 5).`);
        validRows.push({ question_id: q.id, numeric_value: v });
        break;
      }
      case "text": {
        const text = str(a.text_value, MAX_TEXT).trim();
        if (q.is_required && text.length === 0)
          return bad(`Resposta vazia em "${q.question_text}".`);
        if (text.length > 0)
          validRows.push({ question_id: q.id, text_value: text });
        break;
      }
      case "multiple_choice": {
        const choice = str(a.choice_value, 300).trim();
        const opts: string[] = Array.isArray(q.options) ? q.options : [];
        if (!opts.includes(choice))
          return bad(`Opção inválida em "${q.question_text}".`);
        validRows.push({ question_id: q.id, choice_value: choice });
        break;
      }
      case "yes_no": {
        const choice = str(a.choice_value, 10).trim().toLowerCase();
        if (!["sim", "nao", "não"].includes(choice))
          return bad(`Resposta inválida em "${q.question_text}".`);
        validRows.push({
          question_id: q.id,
          choice_value: choice === "não" ? "nao" : choice,
        });
        break;
      }
    }
  }

  // 4. Insert response — business_unit_id/product_id come from survey, NOT client
  const userAgent = str(req.headers.get("user-agent"), 500);
  const { data: resp, error: rErr } = await supabase
    .from("survey_responses")
    .insert({
      survey_id: survey.id,
      business_unit_id: survey.business_unit_id,
      product_id: survey.product_id,
      respondent_name: name,
      respondent_email: email,
      respondent_phone: phoneRaw,
      source: "public_link",
      user_agent: userAgent || null,
    })
    .select("id")
    .single();
  if (rErr || !resp) return bad("Erro ao salvar resposta.", 500);

  if (validRows.length > 0) {
    const rows = validRows.map((r) => ({ response_id: resp.id, ...r }));
    const { error: aErr } = await supabase
      .from("survey_answers")
      .insert(rows);
    if (aErr) {
      // Best-effort: remove the orphan response
      await supabase.from("survey_responses").delete().eq("id", resp.id);
      return bad("Erro ao salvar respostas.", 500);
    }
  }

  return NextResponse.json({ ok: true });
}
