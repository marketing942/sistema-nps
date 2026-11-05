# Mentoria PPPE — Polícia Penal de Pernambuco

Página de venda direta da **Mentoria PPPE**, três planos (Operacional, Supremo e Tático) indo direto
para o checkout. Clone da estrutura da página da Mentoria PMPE (`marketing942/pmpe`), modelo B
(**edital lançado**), com o conteúdo do Edital nº 1 da SAD/SEAP-PE, de 04/11/2026 (Cebraspe).

Estática: `index.html` + `styles.css` + `script.js` + `public/`. Mesmo sistema visual CPPEM
(Oxanium + Rajdhani, ouro `#AF9256` sobre preto `#0A0A0B`).

## ⚠️ Pendências antes de ir ao ar

1. **Brasão oficial.** `public/marca-pppe.webp` e `public/brasao-pppe.webp` são um **brasão provisório**
   (escudo genérico com "Polícia Penal · Pernambuco"). Substitua pelos arquivos oficiais, **com o mesmo
   nome**, WebP com fundo transparente, proporção ~357×419. Refaça também `public/og-mentoria-pppe.jpg`
   (1200×630) com o brasão oficial.
2. **Domínio.** Canonical, og:url, sitemap e JSON-LD apontam para `https://pppe.cppem.com.br/`.
   Confirme o subdomínio (ou troque com busca/substituição de `pppe.cppem.com.br`).
3. **Conferir o edital.** Os dados abaixo vieram de imprensa e portais de concurso; o PDF do edital
   não pôde ser aberto na hora da montagem. Confirme no
   [Cebraspe](https://www.cebraspe.org.br/concursos/SEAP_PE_26).

## Dados do edital usados na página

| Item | Valor | Onde |
|---|---|---|
| Edital | nº 1 SAD-SEAP/PE, 04/11/2026 · banca Cebraspe | `CONFIG.edital` |
| Vagas | 700 imediatas (537 masculinas · 163 femininas) | `index.html` (#concurso) |
| Remuneração inicial | R$ 5.667,92 | `index.html` (#concurso) |
| Requisitos | superior em qualquer área (MEC) + CNH categoria B | FAQ |
| Taxa | R$ 250,00 | FAQ |
| Inscrições | 12/11/2026 a 04/01/2027 (18h) | `CONFIG.edital.inscricoes` |
| Prova objetiva + discursiva | 21/03/2027 (**prevista**) | `CONFIG.edital.prova` / `provaISO` |
| TAF | sem data confirmada → "Conforme edital" | `CONFIG.edital.taf` |

## Oferta e tracking (idênticos à PMPE)

- Planos, preços e links de checkout: `CONFIG.planos` em `script.js` (Operacional 12x R$ 61,00 / R$ 732;
  Tático 12x R$ 104,02 / R$ 997; Supremo 12x R$ 208,35 / R$ 1.997 à vista, de R$ 2.500,20).
- GTM server-side (`sgtm.cppem.com.br`, container GTM-PJ379FLQ) como 1º script do `<head>` + `noscript`.
  É o GTM que carrega a PixelX. Nada foi alterado.
- dataLayer: `modelo_pagina` (no carregamento) e `clique_checkout` (plano, valor). A identificação da
  página é `pagina: "mentoria-pppe"`.
- UTMs (source, medium, campaign, content, term) ficam na sessão e são repassadas ao checkout;
  sem `utm_content`, entra `mentoria-b`.
- Sem formulário e sem exit popup, como a página da PMPE hoje (o popup só existia na página antiga de
  captação).
- `/edital` redireciona para `/` (`vercel.json`).

## Abertura

`?abertura=0` pula, `?abertura=1` força. Toca uma vez por sessão.
