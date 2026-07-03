-- =====================================================================
-- Sistema NPS/CSAT CPPEM — Schema completo
-- Execute este arquivo no SQL Editor do Supabase do projeto destino.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. PROFILES (administradores do sistema)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text,
  email text,
  role text not null default 'admin' check (role in ('admin','viewer','owner')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. BUSINESS UNITS
-- ---------------------------------------------------------------------
create table if not exists public.business_units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand_type text not null check (brand_type in ('cppem','colegio')),
  logo_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. PRODUCTS
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_unit_id uuid not null references public.business_units(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_unit_id, slug)
);

-- ---------------------------------------------------------------------
-- 4. SURVEYS
-- ---------------------------------------------------------------------
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  business_unit_id uuid not null references public.business_units(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  audience text,
  survey_type text not null check (survey_type in ('nps','csat','stars','mixed')),
  public_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  starts_at timestamptz,
  ends_at timestamptz
);

-- ---------------------------------------------------------------------
-- 5. SURVEY QUESTIONS
-- ---------------------------------------------------------------------
create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in (
    'nps_0_10','stars_1_5','csat_1_5','text','multiple_choice','yes_no'
  )),
  options jsonb,
  scale_min integer,
  scale_max integer,
  is_required boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. SURVEY RESPONSES
-- ---------------------------------------------------------------------
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  business_unit_id uuid not null references public.business_units(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  respondent_name text,
  respondent_email text,
  respondent_phone text,
  respondent_type text,
  submitted_at timestamptz not null default now(),
  user_agent text,
  source text
);

create index if not exists idx_responses_survey on public.survey_responses(survey_id);
create index if not exists idx_responses_bu on public.survey_responses(business_unit_id);
create index if not exists idx_responses_product on public.survey_responses(product_id);
create index if not exists idx_responses_submitted on public.survey_responses(submitted_at);

-- ---------------------------------------------------------------------
-- 7. SURVEY ANSWERS
-- ---------------------------------------------------------------------
create table if not exists public.survey_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  numeric_value numeric,
  text_value text,
  choice_value text,
  created_at timestamptz not null default now()
);

create index if not exists idx_answers_response on public.survey_answers(response_id);
create index if not exists idx_answers_question on public.survey_answers(question_id);

-- ---------------------------------------------------------------------
-- 8. VIEW de respostas com classificação NPS / CSAT / Estrelas
-- ---------------------------------------------------------------------
create or replace view public.v_answers_classified as
select
  a.id as answer_id,
  a.response_id,
  a.question_id,
  a.numeric_value,
  a.text_value,
  a.choice_value,
  q.question_type,
  r.survey_id,
  r.business_unit_id,
  r.product_id,
  r.submitted_at,
  case
    when q.question_type = 'nps_0_10' and a.numeric_value between 9 and 10 then 'promoter'
    when q.question_type = 'nps_0_10' and a.numeric_value between 7 and 8 then 'neutral'
    when q.question_type = 'nps_0_10' and a.numeric_value between 0 and 6 then 'detractor'
    when q.question_type = 'stars_1_5' and a.numeric_value = 5 then 'promoter'
    when q.question_type = 'stars_1_5' and a.numeric_value = 4 then 'neutral'
    when q.question_type = 'stars_1_5' and a.numeric_value between 1 and 3 then 'detractor'
    when q.question_type = 'csat_1_5' and a.numeric_value between 4 and 5 then 'satisfied'
    when q.question_type = 'csat_1_5' and a.numeric_value = 3 then 'csat_neutral'
    when q.question_type = 'csat_1_5' and a.numeric_value between 1 and 2 then 'unsatisfied'
    else null
  end as classification
from public.survey_answers a
join public.survey_questions q on q.id = a.question_id
join public.survey_responses r on r.id = a.response_id;

-- ---------------------------------------------------------------------
-- 9. VIEWS por respondente (1 linha por response com a nota canônica)
-- ---------------------------------------------------------------------
create or replace view public.v_response_nps as
select distinct on (r.id)
  r.id as response_id, r.survey_id, r.business_unit_id, r.product_id, r.submitted_at,
  a.numeric_value::int as nps_score,
  case
    when a.numeric_value between 9 and 10 then 'promoter'
    when a.numeric_value between 7 and 8  then 'neutral'
    when a.numeric_value between 0 and 6  then 'detractor'
  end as classification
from public.survey_responses r
join public.survey_answers a   on a.response_id = r.id
join public.survey_questions q on q.id = a.question_id
where q.question_type = 'nps_0_10' and a.numeric_value is not null
order by r.id, q.order_index asc, a.created_at asc;

create or replace view public.v_response_csat as
select distinct on (r.id)
  r.id as response_id, r.survey_id, r.business_unit_id, r.product_id, r.submitted_at,
  a.numeric_value::int as csat_score,
  case
    when a.numeric_value between 4 and 5 then 'satisfied'
    when a.numeric_value = 3              then 'csat_neutral'
    when a.numeric_value between 1 and 2 then 'unsatisfied'
  end as classification
from public.survey_responses r
join public.survey_answers a   on a.response_id = r.id
join public.survey_questions q on q.id = a.question_id
where q.question_type = 'csat_1_5' and a.numeric_value is not null
order by r.id, q.order_index asc, a.created_at asc;

create or replace view public.v_response_stars as
select distinct on (r.id)
  r.id as response_id, r.survey_id, r.business_unit_id, r.product_id, r.submitted_at,
  a.numeric_value::int as star_score,
  case
    when a.numeric_value = 5              then 'promoter'
    when a.numeric_value = 4              then 'neutral'
    when a.numeric_value between 1 and 3 then 'detractor'
  end as classification
from public.survey_responses r
join public.survey_answers a   on a.response_id = r.id
join public.survey_questions q on q.id = a.question_id
where q.question_type = 'stars_1_5' and a.numeric_value is not null
order by r.id, q.order_index asc, a.created_at asc;

-- ---------------------------------------------------------------------
-- 10. VIEW agregada por pesquisa (por respondente)
-- ---------------------------------------------------------------------
create or replace view public.v_survey_metrics as
with
nps_agg as (
  select survey_id, business_unit_id, product_id,
    count(*) as t,
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
  from public.v_response_stars group by survey_id
),
resp_agg as (
  select survey_id, count(*) as cnt
  from public.survey_responses group by survey_id
)
select
  s.id as survey_id, s.name as survey_name,
  s.business_unit_id, s.product_id,
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

-- ---------------------------------------------------------------------
-- 11. FUNÇÃO: métricas filtradas (por respondente)
-- ---------------------------------------------------------------------
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
    select count(*) as t,
      count(*) filter (where classification='promoter')  as p,
      count(*) filter (where classification='neutral')   as n,
      count(*) filter (where classification='detractor') as d
    from public.v_response_nps where response_id in (select id from filter_ids)
  ),
  csat as (
    select count(*) as t,
      count(*) filter (where classification='satisfied') as s,
      avg(csat_score) as avg_score
    from public.v_response_csat where response_id in (select id from filter_ids)
  ),
  stars as (
    select count(*) as t, avg(star_score) as avg_score
    from public.v_response_stars where response_id in (select id from filter_ids)
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

-- ---------------------------------------------------------------------
-- 11. RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.business_units enable row level security;
alter table public.products enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_answers enable row level security;

-- Admin policies: usuários autenticados podem tudo
drop policy if exists "admin_all_profiles" on public.profiles;
create policy "admin_all_profiles" on public.profiles
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_all_bu" on public.business_units;
create policy "admin_all_bu" on public.business_units
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_all_products" on public.products;
create policy "admin_all_products" on public.products
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_all_surveys" on public.surveys;
create policy "admin_all_surveys" on public.surveys
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_all_questions" on public.survey_questions;
create policy "admin_all_questions" on public.survey_questions
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_all_responses" on public.survey_responses;
create policy "admin_all_responses" on public.survey_responses
  for all to authenticated using (true) with check (true);

drop policy if exists "admin_all_answers" on public.survey_answers;
create policy "admin_all_answers" on public.survey_answers
  for all to authenticated using (true) with check (true);

-- Acesso público (anon) — leitura mínima para renderizar pesquisa
drop policy if exists "public_read_active_surveys" on public.surveys;
create policy "public_read_active_surveys" on public.surveys
  for select to anon using (is_active = true);

drop policy if exists "public_read_questions" on public.survey_questions;
create policy "public_read_questions" on public.survey_questions
  for select to anon using (
    exists (select 1 from public.surveys s
            where s.id = survey_id and s.is_active = true)
  );

drop policy if exists "public_read_bu" on public.business_units;
create policy "public_read_bu" on public.business_units
  for select to anon using (true);

drop policy if exists "public_read_products" on public.products;
create policy "public_read_products" on public.products
  for select to anon using (true);

-- Submissão pública: feita exclusivamente pela API route
-- /api/survey/submit usando SUPABASE_SERVICE_ROLE_KEY.
-- Anon NÃO pode inserir/atualizar/remover respostas.
revoke insert, update, delete on public.survey_responses from anon;
revoke insert, update, delete on public.survey_answers from anon;

-- Defesa em profundidade — anon não acessa agregados/análises.
revoke select on public.v_answers_classified from anon;
revoke select on public.v_survey_metrics from anon;
revoke execute on function public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz) from anon;
grant select on public.v_answers_classified to authenticated;
grant select on public.v_survey_metrics to authenticated;
grant execute on function public.fn_metrics_overview(uuid, uuid, timestamptz, timestamptz) to authenticated;

-- CHECK constraints adicionais
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'survey_answers_numeric_range') then
    alter table public.survey_answers
      add constraint survey_answers_numeric_range
      check (numeric_value is null or (numeric_value >= 0 and numeric_value <= 10));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'survey_answers_text_length') then
    alter table public.survey_answers
      add constraint survey_answers_text_length
      check (text_value is null or char_length(text_value) <= 5000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'survey_responses_email_length') then
    alter table public.survey_responses
      add constraint survey_responses_email_length
      check (respondent_email is null or char_length(respondent_email) <= 320);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'survey_responses_name_length') then
    alter table public.survey_responses
      add constraint survey_responses_name_length
      check (respondent_name is null or char_length(respondent_name) <= 300);
  end if;
end $$;
