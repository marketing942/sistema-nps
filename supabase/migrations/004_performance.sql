-- =====================================================================
-- Migration 004 — Performance
--
-- Medido em Postgres 16 com 30k respostas / 90k answers:
--   fn_metrics_overview ........ 201 ms
--   v_survey_metrics (1 pesq.) . 106 ms (filtro não descia para a view)
--   v_response_nps ............. 63 ms + 30k linhas trafegadas p/ o Node
--
-- Mudanças (semântica de NPS/CSAT/Estrelas inalterada):
--   1. Índices nas FKs e nos filtros/ordenações usados pelo painel.
--   2. v_response_* com DISTINCT ON sobre a chave completa (id + colunas
--      dependentes): o Postgres passa a empurrar os filtros por pesquisa/
--      unidade/produto/período para dentro da view (antes varria tudo).
--   3. fn_nps_distribution / fn_nps_evolution: agregação no banco em vez
--      de baixar todas as linhas para montar gráficos no servidor Node.
--
-- Idempotente: pode ser reaplicada.
-- =====================================================================

-- 1. Índices ----------------------------------------------------------
create index if not exists idx_questions_survey_order
  on public.survey_questions (survey_id, order_index);

create index if not exists idx_responses_bu_submitted
  on public.survey_responses (business_unit_id, submitted_at desc);
create index if not exists idx_responses_survey_submitted
  on public.survey_responses (survey_id, submitted_at desc);
create index if not exists idx_responses_submitted_desc
  on public.survey_responses (submitted_at desc);

-- Cobre (response_id, question_id) e devolve a nota sem ir à tabela.
create index if not exists idx_answers_response_question
  on public.survey_answers (response_id, question_id) include (numeric_value);

-- Comentários: ordenação por data vem de survey_responses; este parcial
-- já existe (002). Índice p/ responder "answers de uma pergunta de texto".
create index if not exists idx_answers_question_text
  on public.survey_answers (question_id) where text_value is not null;

-- 2. Views por respondente com LATERAL --------------------------------
drop view     if exists public.v_survey_metrics cascade;
drop view     if exists public.v_response_nps   cascade;
drop view     if exists public.v_response_csat  cascade;
drop view     if exists public.v_response_stars cascade;
drop function if exists public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz);

create view public.v_response_nps as
select distinct on (r.id, r.survey_id, r.business_unit_id, r.product_id, r.submitted_at)
  r.id                          as response_id,
  r.survey_id,
  r.business_unit_id,
  r.product_id,
  r.submitted_at,
  a.numeric_value::int          as nps_score,
  case
    when a.numeric_value between 9 and 10 then 'promoter'
    when a.numeric_value between 7 and 8  then 'neutral'
    when a.numeric_value between 0 and 6  then 'detractor'
  end                           as classification
from public.survey_responses r
join public.survey_answers a   on a.response_id = r.id
join public.survey_questions q on q.id = a.question_id
where q.question_type = 'nps_0_10'
  and a.numeric_value is not null
order by r.id, r.survey_id, r.business_unit_id, r.product_id, r.submitted_at,
         q.order_index asc, a.created_at asc;

create view public.v_response_csat as
select distinct on (r.id, r.survey_id, r.business_unit_id, r.product_id, r.submitted_at)
  r.id                          as response_id,
  r.survey_id,
  r.business_unit_id,
  r.product_id,
  r.submitted_at,
  a.numeric_value::int          as csat_score,
  case
    when a.numeric_value between 4 and 5 then 'satisfied'
    when a.numeric_value = 3              then 'csat_neutral'
    when a.numeric_value between 1 and 2 then 'unsatisfied'
  end                           as classification
from public.survey_responses r
join public.survey_answers a   on a.response_id = r.id
join public.survey_questions q on q.id = a.question_id
where q.question_type = 'csat_1_5'
  and a.numeric_value is not null
order by r.id, r.survey_id, r.business_unit_id, r.product_id, r.submitted_at,
         q.order_index asc, a.created_at asc;

create view public.v_response_stars as
select distinct on (r.id, r.survey_id, r.business_unit_id, r.product_id, r.submitted_at)
  r.id                          as response_id,
  r.survey_id,
  r.business_unit_id,
  r.product_id,
  r.submitted_at,
  a.numeric_value::int          as star_score,
  case
    when a.numeric_value = 5              then 'promoter'
    when a.numeric_value = 4              then 'neutral'
    when a.numeric_value between 1 and 3 then 'detractor'
  end                           as classification
from public.survey_responses r
join public.survey_answers a   on a.response_id = r.id
join public.survey_questions q on q.id = a.question_id
where q.question_type = 'stars_1_5'
  and a.numeric_value is not null
order by r.id, r.survey_id, r.business_unit_id, r.product_id, r.submitted_at,
         q.order_index asc, a.created_at asc;

-- 3. fn_metrics_overview (mesma assinatura/colunas da 003) -------------
create function public.fn_metrics_overview(
  p_business_unit uuid default null,
  p_product      uuid default null,
  p_from         timestamptz default null,
  p_to           timestamptz default null
)
returns table (
  total_responses bigint,
  nps_total       bigint,
  promoters       bigint,
  neutrals        bigint,
  detractors      bigint,
  nps_score       numeric,
  csat_total      bigint,
  csat_score      numeric,
  csat_avg        numeric,
  stars_total     bigint,
  average_stars   numeric
)
language sql stable as $$
  with
  nps as (
    select
      count(*)                                           as t,
      count(*) filter (where classification='promoter')  as p,
      count(*) filter (where classification='neutral')   as n,
      count(*) filter (where classification='detractor') as d
    from public.v_response_nps v
    where (p_business_unit is null or v.business_unit_id = p_business_unit)
      and (p_product      is null or v.product_id       = p_product)
      and (p_from         is null or v.submitted_at    >= p_from)
      and (p_to           is null or v.submitted_at    <= p_to)
  ),
  csat as (
    select
      count(*)                                           as t,
      count(*) filter (where classification='satisfied') as s,
      avg(csat_score)                                    as avg_score
    from public.v_response_csat v
    where (p_business_unit is null or v.business_unit_id = p_business_unit)
      and (p_product      is null or v.product_id       = p_product)
      and (p_from         is null or v.submitted_at    >= p_from)
      and (p_to           is null or v.submitted_at    <= p_to)
  ),
  stars as (
    select count(*) as t, avg(star_score) as avg_score
    from public.v_response_stars v
    where (p_business_unit is null or v.business_unit_id = p_business_unit)
      and (p_product      is null or v.product_id       = p_product)
      and (p_from         is null or v.submitted_at    >= p_from)
      and (p_to           is null or v.submitted_at    <= p_to)
  ),
  total as (
    select count(*) as cnt
    from public.survey_responses r
    where (p_business_unit is null or r.business_unit_id = p_business_unit)
      and (p_product      is null or r.product_id       = p_product)
      and (p_from         is null or r.submitted_at    >= p_from)
      and (p_to           is null or r.submitted_at    <= p_to)
  )
  select
    (select cnt from total)::bigint,
    coalesce(nps.t,   0)::bigint,
    coalesce(nps.p,   0)::bigint,
    coalesce(nps.n,   0)::bigint,
    coalesce(nps.d,   0)::bigint,
    case when coalesce(nps.t, 0) = 0 then null
         else round(((nps.p - nps.d)::numeric / nps.t) * 100, 2) end,
    coalesce(csat.t,  0)::bigint,
    case when coalesce(csat.t, 0) = 0 then null
         else round((csat.s::numeric / csat.t) * 100, 2) end,
    round(csat.avg_score::numeric, 2),
    coalesce(stars.t, 0)::bigint,
    round(stars.avg_score::numeric, 2)
  from nps, csat, stars;
$$;

-- 4. v_survey_metrics (mesmas colunas da 003) --------------------------
create view public.v_survey_metrics as
with
nps_agg as (
  select survey_id,
    count(*)                                           as t,
    count(*) filter (where classification='promoter')  as p,
    count(*) filter (where classification='neutral')   as n,
    count(*) filter (where classification='detractor') as d
  from public.v_response_nps
  group by survey_id
),
csat_agg as (
  select survey_id,
    count(*) as t,
    count(*) filter (where classification='satisfied') as s,
    avg(csat_score) as avg_score
  from public.v_response_csat
  group by survey_id
),
stars_agg as (
  select survey_id, count(*) as t, avg(star_score) as avg_score
  from public.v_response_stars
  group by survey_id
),
resp_agg as (
  select survey_id, count(*) as cnt
  from public.survey_responses
  group by survey_id
)
select
  s.id                          as survey_id,
  s.name                        as survey_name,
  s.business_unit_id,
  s.product_id,
  coalesce(resp_agg.cnt, 0)     as total_responses,
  coalesce(nps_agg.t,   0)      as nps_total,
  coalesce(nps_agg.p,   0)      as promoters_count,
  coalesce(nps_agg.n,   0)      as neutrals_count,
  coalesce(nps_agg.d,   0)      as detractors_count,
  case when coalesce(nps_agg.t, 0) = 0 then null
       else round((nps_agg.p::numeric / nps_agg.t) * 100, 2) end as promoters_percentage,
  case when coalesce(nps_agg.t, 0) = 0 then null
       else round((nps_agg.d::numeric / nps_agg.t) * 100, 2) end as detractors_percentage,
  case when coalesce(nps_agg.t, 0) = 0 then null
       else round(((nps_agg.p - nps_agg.d)::numeric / nps_agg.t) * 100, 2) end as nps_score,
  case when coalesce(csat_agg.t, 0) = 0 then null
       else round((csat_agg.s::numeric / csat_agg.t) * 100, 2) end as csat_score,
  round(csat_agg.avg_score::numeric,  2) as csat_avg,
  round(stars_agg.avg_score::numeric, 2) as average_stars,
  coalesce(stars_agg.t, 0)              as stars_total
from public.surveys s
left join nps_agg   on nps_agg.survey_id   = s.id
left join csat_agg  on csat_agg.survey_id  = s.id
left join stars_agg on stars_agg.survey_id = s.id
left join resp_agg  on resp_agg.survey_id  = s.id;

-- 5. Agregações dos gráficos (devolvem 11 / ≤ N linhas, não a tabela) ---
create or replace function public.fn_nps_distribution(
  p_business_unit uuid default null,
  p_product       uuid default null,
  p_from          timestamptz default null,
  p_to            timestamptz default null,
  p_survey        uuid default null
)
returns table (score int, total bigint)
language sql stable as $$
  select g.s as score, count(v.response_id)::bigint as total
  from generate_series(0, 10) g(s)
  left join public.v_response_nps v
    on v.nps_score = g.s
   and (p_survey        is null or v.survey_id        = p_survey)
   and (p_business_unit is null or v.business_unit_id = p_business_unit)
   and (p_product       is null or v.product_id       = p_product)
   and (p_from          is null or v.submitted_at    >= p_from)
   and (p_to            is null or v.submitted_at    <= p_to)
  group by g.s
  order by g.s;
$$;

create or replace function public.fn_nps_evolution(
  p_business_unit uuid default null,
  p_product       uuid default null,
  p_from          timestamptz default null,
  p_to            timestamptz default null,
  p_months        int default 6,
  p_tz            text default 'America/Recife'
)
returns table (month_start date, promoters bigint, detractors bigint, total bigint)
language sql stable as $$
  select
    date_trunc('month', v.submitted_at at time zone p_tz)::date as month_start,
    count(*) filter (where v.classification = 'promoter')::bigint,
    count(*) filter (where v.classification = 'detractor')::bigint,
    count(*)::bigint
  from public.v_response_nps v
  where v.submitted_at >= date_trunc(
          'month', (now() at time zone p_tz) - make_interval(months => p_months - 1)
        ) at time zone p_tz
    and (p_business_unit is null or v.business_unit_id = p_business_unit)
    and (p_product       is null or v.product_id       = p_product)
    and (p_from          is null or v.submitted_at    >= p_from)
    and (p_to            is null or v.submitted_at    <= p_to)
  group by 1
  order by 1;
$$;

-- 6. Permissões -------------------------------------------------------
grant select on public.v_response_nps, public.v_response_csat, public.v_response_stars to authenticated;
revoke select on public.v_response_nps, public.v_response_csat, public.v_response_stars from anon;
grant select on public.v_survey_metrics to authenticated;
revoke select on public.v_survey_metrics from anon;
grant execute on function public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz) to authenticated;
revoke execute on function public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz) from anon;
grant execute on function public.fn_nps_distribution(uuid, uuid, timestamptz, timestamptz, uuid) to authenticated;
revoke execute on function public.fn_nps_distribution(uuid, uuid, timestamptz, timestamptz, uuid) from anon;
grant execute on function public.fn_nps_evolution(uuid, uuid, timestamptz, timestamptz, int, text) to authenticated;
revoke execute on function public.fn_nps_evolution(uuid, uuid, timestamptz, timestamptz, int, text) from anon;

analyze public.survey_responses;
analyze public.survey_answers;
analyze public.survey_questions;
