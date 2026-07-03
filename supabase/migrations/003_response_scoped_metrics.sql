-- =====================================================================
-- Migration 003 — Métricas por respondente (não por resposta-de-pergunta)
--
-- Bug corrigido: quando uma pesquisa tinha mais de uma pergunta NPS,
-- cada resposta de pergunta era contada como uma "voz" NPS separada.
-- O denominador (promotores+neutros+detratores) inflava enquanto o
-- card "Total de respostas" continuava contando respondentes únicos.
-- Isso produzia NPS acima de +100 e contadores descasados.
--
-- A partir daqui:
--   - Cada respondente contribui com UMA nota NPS canônica (a primeira
--     pergunta NPS na ordem de exibição da pesquisa).
--   - Igual para CSAT e Estrelas.
--   - promotores + neutros + detratores = total de respondentes que
--     responderam à pergunta NPS.
-- =====================================================================

-- 1. Views por respondente
create or replace view public.v_response_nps as
select distinct on (r.id)
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
order by r.id, q.order_index asc, a.created_at asc;

create or replace view public.v_response_csat as
select distinct on (r.id)
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
order by r.id, q.order_index asc, a.created_at asc;

create or replace view public.v_response_stars as
select distinct on (r.id)
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
order by r.id, q.order_index asc, a.created_at asc;

-- 2. Função de métricas do dashboard, agora contando respondentes
-- (drop antes porque o tipo de retorno mudou — novas colunas
-- nps_total, csat_total e stars_total)
drop function if exists public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz);

create or replace function public.fn_metrics_overview(
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
  with filter_ids as (
    select r.id
    from public.survey_responses r
    where (p_business_unit is null or r.business_unit_id = p_business_unit)
      and (p_product      is null or r.product_id       = p_product)
      and (p_from         is null or r.submitted_at    >= p_from)
      and (p_to           is null or r.submitted_at    <= p_to)
  ),
  nps as (
    select
      count(*)                                      as t,
      count(*) filter (where classification='promoter')  as p,
      count(*) filter (where classification='neutral')   as n,
      count(*) filter (where classification='detractor') as d
    from public.v_response_nps
    where response_id in (select id from filter_ids)
  ),
  csat as (
    select
      count(*)                                      as t,
      count(*) filter (where classification='satisfied') as s,
      avg(csat_score)                               as avg_score
    from public.v_response_csat
    where response_id in (select id from filter_ids)
  ),
  stars as (
    select count(*) as t, avg(star_score) as avg_score
    from public.v_response_stars
    where response_id in (select id from filter_ids)
  ),
  total as (select count(*) as cnt from filter_ids)
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

-- 3. View v_survey_metrics reescrita
-- (drop antes porque a lista de colunas mudou — nova coluna nps_total
-- e ordem diferente)
drop view if exists public.v_survey_metrics cascade;

create view public.v_survey_metrics as
with
nps_agg as (
  select
    survey_id, business_unit_id, product_id,
    count(*)                                      as t,
    count(*) filter (where classification='promoter')  as p,
    count(*) filter (where classification='neutral')   as n,
    count(*) filter (where classification='detractor') as d
  from public.v_response_nps
  group by survey_id, business_unit_id, product_id
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

-- 4. Permissões
grant select on public.v_response_nps, public.v_response_csat, public.v_response_stars to authenticated;
revoke select on public.v_response_nps, public.v_response_csat, public.v_response_stars from anon;
grant execute on function public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz) to authenticated;
revoke execute on function public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz) from anon;
