# Central CPPEM — NPS & CSAT

Sistema interno de gestão da satisfação dos clientes, com painel administrativo, criação dinâmica de pesquisas e links públicos por unidade de negócio.

- **Stack**: Next.js 14 (App Router) · Tailwind CSS · Supabase · Recharts · Lucide
- **Unidades de negócio**: CPPEM Concursos (preto/verde militar) e Colégio CPPEM (azul-marinho/dourado)
- **Deploy**: Vercel

---

## 1. Configurando o Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com).
2. No SQL Editor, rode na ordem:
   - `supabase/schema.sql` (tabelas, views, função `fn_metrics_overview` e RLS)
   - `supabase/seed.sql` (cadastra as duas unidades de negócio e produtos iniciais)
3. Em **Authentication → Users**, crie o e-mail/senha do administrador (login do painel).
4. Em **Project Settings → API**, copie a URL do projeto e a `anon key`.

> Os respondentes públicos não fazem login. As policies de RLS já permitem inserir respostas anonimamente em pesquisas ativas.

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` é opcional — só será necessário se você quiser estender o sistema com tarefas administrativas server-side.

## 3. Rodando localmente

```bash
npm install
npm run dev
```

- Painel: `http://localhost:3000/admin/login`
- Link público de exemplo: `http://localhost:3000/pesquisa/<slug>`

## 4. Deploy na Vercel

1. Suba o repositório no GitHub.
2. Na Vercel, importe o projeto.
3. Em **Environment Variables**, preencha as três variáveis acima.
4. Deploy. A URL final substitui `NEXT_PUBLIC_SITE_URL`.

## 5. Estrutura

```
src/
├─ app/
│  ├─ pesquisa/[slug]/           ← Página pública da pesquisa
│  ├─ admin/
│  │  ├─ dashboard/              ← KPIs, gráficos, comentários
│  │  ├─ pesquisas/              ← CRUD e métricas por pesquisa
│  │  ├─ respostas/              ← Lista de respostas + export CSV
│  │  ├─ comentarios/            ← Central de comentários com risco
│  │  ├─ produtos/               ← CRUD de produtos/públicos
│  │  └─ configuracoes/          ← Conta, unidades, regras
│  └─ api/export/responses/      ← Exportação CSV (admin)
├─ components/                   ← UI, charts, admin layout
├─ lib/                          ← supabase clients, brands, NPS, types
└─ middleware.ts                 ← Proteção das rotas /admin
supabase/
├─ schema.sql                    ← Tabelas, views, função e RLS
└─ seed.sql                      ← Unidades de negócio + produtos base
```

## 6. Regras de cálculo

| Métrica | Escala | Promotor / Satisfeito | Neutro | Detrator / Insatisfeito |
|--------:|:------:|:---------------------:|:------:|:-----------------------:|
| **NPS**     | 0–10 | 9–10 | 7–8 | 0–6 |
| **Estrelas**| 1–5  | 5    | 4   | 1–3 |
| **CSAT**    | 1–5  | 4–5  | 3   | 1–2 |

- `NPS = % promotores − % detratores`
- `CSAT (%) = % de notas 4 e 5`
- Média de estrelas: média aritmética
- Todos os cálculos consolidados são feitos por **views SQL** no Supabase (`v_answers_classified`, `v_survey_metrics`) e pela função `fn_metrics_overview` (filtragem por unidade, produto e período).

## 7. Comentários e risco

A página `/admin/comentarios` destaca:

- Comentários por categoria (promotor / neutro / detrator).
- Comentários com palavras-chave de risco (`cancelar`, `péssimo`, `desistir`, etc.) — lógica em `src/lib/nps.ts` (`detectRisk`). O modelo está preparado para evoluir com classificação de sentimento por IA.

## 8. Branding por unidade

`src/lib/brands.ts` e classes CSS escopadas (`brand-cppem`, `brand-colegio` em `globals.css`) aplicam logo, cores, tipografia e tom da unidade na **página pública da pesquisa**. O painel administrativo é unificado e dark.

## 9. Fluxo de uso

1. Administrador entra em `/admin/login`.
2. Cria/edita produtos em `/admin/produtos`.
3. Cria uma nova pesquisa em `/admin/pesquisas/nova` (unidade → produto → tipo → perguntas).
4. Copia o link público da pesquisa e envia para os clientes/alunos/pais.
5. Acompanha respostas, NPS, CSAT e comentários no `/admin/dashboard`.

## 10. Próximos passos sugeridos

- Adicionar classificação de sentimentos via IA na área de comentários.
- Criar alertas por e-mail/WhatsApp quando um detrator for registrado.
- Cadastro de usuários administradores diretamente pelo painel.
