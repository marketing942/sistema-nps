-- =====================================================================
-- Migration 002 — Hardening de segurança
--
-- A partir desta migration, o envio público de respostas SAI das policies
-- RLS do anon e passa a ser feito SOMENTE via API route protegida que
-- usa service_role e valida tudo (rate limit, ranges, ownership).
--
-- Aplique APENAS depois de fazer o deploy do novo código que envia
-- via /api/survey/submit (caso contrário, novos envios passam a falhar
-- temporariamente).
-- =====================================================================

-- 1) Revogar policies/permissões de INSERT do anon nas tabelas de
--    respostas. Manter SELECT em surveys/questions/business_units/products
--    para a página pública continuar carregando.
drop policy if exists "public_insert_responses" on public.survey_responses;
drop policy if exists "public_insert_answers" on public.survey_answers;

revoke insert, update, delete on public.survey_responses from anon;
revoke insert, update, delete on public.survey_answers from anon;

-- 2) Bloquear leitura direta das views agregadas e função de métricas
--    por anon (defesa em profundidade — o painel é authenticated only).
revoke select on public.v_answers_classified from anon;
revoke select on public.v_survey_metrics from anon;
revoke execute on function public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz) from anon;

grant select on public.v_answers_classified to authenticated;
grant select on public.v_survey_metrics to authenticated;
grant execute on function public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz) to authenticated;

-- 3) CHECK constraints — garantia adicional além da validação na API.
--    Reaplicar com IF NOT EXISTS via DO block.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'survey_answers_numeric_range'
  ) then
    alter table public.survey_answers
      add constraint survey_answers_numeric_range
      check (
        numeric_value is null
        or (numeric_value >= 0 and numeric_value <= 10)
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'survey_answers_text_length'
  ) then
    alter table public.survey_answers
      add constraint survey_answers_text_length
      check (text_value is null or char_length(text_value) <= 5000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'survey_responses_email_length'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_email_length
      check (
        respondent_email is null
        or char_length(respondent_email) <= 320
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'survey_responses_name_length'
  ) then
    alter table public.survey_responses
      add constraint survey_responses_name_length
      check (
        respondent_name is null
        or char_length(respondent_name) <= 300
      );
  end if;
end $$;

-- 4) Índice para ajudar nas consultas mais comuns de comentários/risco.
create index if not exists idx_answers_text_not_null
  on public.survey_answers (response_id)
  where text_value is not null;
