-- =====================================================================
-- Dados iniciais — apenas as unidades de negócio e alguns produtos.
-- Não insere respostas falsas — o sistema deve refletir respostas reais.
-- =====================================================================

insert into public.business_units (name, slug, brand_type, logo_url, primary_color, secondary_color)
values
  ('CPPEM Concursos', 'cppem-concursos', 'cppem',
   'https://raw.githubusercontent.com/marketing942/fotos-dos-bots/main/LOGO%20CPPEM.png',
   '#00E63C', '#0A0A0A'),
  ('Colégio CPPEM', 'colegio-cppem', 'colegio',
   'https://raw.githubusercontent.com/marketing942/fotos-dos-bots/main/LOGO%20COLE%CC%81GIO.png',
   '#0D1B3E', '#C9A227')
on conflict (slug) do update set
  name = excluded.name,
  brand_type = excluded.brand_type,
  logo_url = excluded.logo_url,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color;

-- Produtos iniciais — CPPEM Concursos
with bu as (select id from public.business_units where slug = 'cppem-concursos')
insert into public.products (business_unit_id, name, slug, description)
select bu.id, x.name, x.slug, x.description from bu, (values
  ('Turma Presencial CPPEM', 'turma-presencial', 'Curso presencial em Caruaru'),
  ('Plano de Combate (Mentoria)', 'plano-de-combate', 'Mentoria CPPEM com acompanhamento'),
  ('Cursos Online', 'cursos-online', 'Cursos online pré e pós-edital'),
  ('Aulões e Eventos', 'auloes-eventos', 'Aulões e eventos presenciais/online'),
  ('Materiais Físicos/Digitais', 'materiais', 'Apostilas, cadernos e materiais digitais')
) as x(name, slug, description)
on conflict (business_unit_id, slug) do nothing;

-- Produtos iniciais — Colégio CPPEM
with bu as (select id from public.business_units where slug = 'colegio-cppem')
insert into public.products (business_unit_id, name, slug, description)
select bu.id, x.name, x.slug, x.description from bu, (values
  ('Pesquisa Geral — Alunos', 'pesquisa-alunos', 'Satisfação geral dos alunos'),
  ('Pesquisa Geral — Pais/Responsáveis', 'pesquisa-pais', 'Satisfação dos pais e responsáveis'),
  ('Avaliação de Professores', 'avaliacao-professores', 'Avaliação do corpo docente'),
  ('Estrutura e Instalações', 'estrutura', 'Avaliação da estrutura escolar'),
  ('Atendimento e Secretaria', 'atendimento', 'Avaliação do atendimento e secretaria')
) as x(name, slug, description)
on conflict (business_unit_id, slug) do nothing;
