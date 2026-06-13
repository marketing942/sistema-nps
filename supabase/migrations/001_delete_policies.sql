-- =====================================================================
-- Migration 001 — Permite que administradores autenticados removam
-- respostas e respostas individuais (úteis para testes e limpeza).
-- Rode este arquivo no SQL Editor se você já aplicou o schema.sql.
-- =====================================================================

drop policy if exists "admin_all_responses" on public.survey_responses;
create policy "admin_all_responses" on public.survey_responses
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_all_answers" on public.survey_answers;
create policy "admin_all_answers" on public.survey_answers
  for all to authenticated using (true) with check (true);
