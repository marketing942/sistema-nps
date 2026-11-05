/* =========================================================
   CPPEM · MENTORIA PPPE (Polícia Penal PE) — modelo B (edital lançado)
   ---------------------------------------------------------
     1. CONFIG      planos, links e datas do edital — ÚNICO lugar
     2. PLANOS      escreve o CONFIG nos cards e nos CTAs
     3. ABERTURA    as duas batidas, a trinca e a saída da cena
     4. FX          faíscas e brasas da hero, em canvas
     5. PÁGINA      header, progresso, parallax, dock
     6. REVEAL      entrada ao rolar, corrida, contagem de números
     7. PEÇAS       plataforma, galeria, estrelas, contagem da prova
     8. ATMOSFERA   brasas da página
   ========================================================= */
(function () {
  "use strict";

  /* =========================================================
     1 · CONFIG
     ---------------------------------------------------------
     Os valores dos planos espelham o Plano de Combate do site
     (siteCppemNovo/app/plano-de-combate). Mudou lá, muda aqui.

     `de` vazio some da tela: um "de/por" inventado seria número
     falso na cara do comprador. Quando a PROMOÇÃO do Supremo
     tiver valor cheio de verdade, é só preencher.
     ========================================================= */
  var CONFIG = {
    pagina: "mentoria-pppe",
    whats:  "558173105354",

    planos: {
      operacional: {
        nome: "Plano Operacional",
        mensal: "R$ 61,00", vista: "R$ 732", de: "",
        checkout: "https://pxa.cppem.com.br/lt/plano-de-combate-operacional"
      },
      tatico: {
        nome: "Plano Tático",
        mensal: "R$ 104,02", vista: "R$ 997", de: "",
        checkout: "https://pxa.cppem.com.br/lt/plano-de-combate-tatico"
      },
      supremo: {
        nome: "Plano Supremo",
        /* de/por REAL: "de" = o total parcelado (12 × 208,35), "por" = à
           vista. Se um dia houver preço cheio oficial, ele entra no `de` e
           a economia/o OFF são recalculados à mão. */
        mensal: "R$ 208,35", vista: "R$ 1.997", de: "R$ 2.500,20",
        off: "20% OFF à vista", selo: "Você economiza R$ 503,20 à vista",
        checkout: "https://pxa.cppem.com.br/lt/plano-de-combate-supremo"
      }
    },

    /* Edital nº 1 SAD-SEAP/PE, de 04/11/2026 (Cebraspe) — conferir em
       https://www.cebraspe.org.br/concursos/SEAP_PE_26
       A prova é PREVISTA para 21/03/2027; o horário não foi confirmado,
       então a contagem vai até o início do dia. TAF: sem data confirmada
       no edital consultado — fica "Conforme edital". */
    edital: {
      publicacao: "04/11/2026",
      inscricoes: "12/11/2026 a 04/01/2027",
      prova:      "21/03/2027 (prevista)",
      taf:        "",
      provaISO:   "2027-03-21T00:00:00-03:00"
    }
  };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var raiz = document.documentElement;
  var modelo = raiz.getAttribute("data-modelo") || "a";

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function push(dados) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(dados); }

  push({ event: "modelo_pagina", pagina: CONFIG.pagina, modelo: modelo });

  /* =========================================================
     2 · PLANOS E CHECKOUT
     ========================================================= */
  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  (function guardarUTMs() {
    var qs = new URLSearchParams(location.search);
    UTM.forEach(function (k) {
      var v = qs.get(k);
      if (v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
    });
  })();
  function utm(k) {
    var v = new URLSearchParams(location.search).get(k);
    if (v) return v;
    try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; }
  }
  function comUTM(base) {
    try {
      var u = new URL(base);
      UTM.forEach(function (k) { var v = utm(k); if (v && !u.searchParams.has(k)) u.searchParams.set(k, v); });
      /* o modelo segue junto: é assim que o A/B aparece na venda */
      if (!u.searchParams.has("utm_content") && !utm("utm_content")) u.searchParams.set("utm_content", "mentoria-" + modelo);
      return u.toString();
    } catch (e) { return base; }
  }

  $$("[data-plano]").forEach(function (card) {
    var id = card.getAttribute("data-plano");
    var p = CONFIG.planos[id];
    if (!p) return;
    var slot = function (n) { return $('[data-p="' + n + '"]', card); };
    var mensal = slot("mensal"), vista = slot("vista"), de = slot("de"), selo = slot("selo");
    if (mensal) mensal.textContent = p.mensal;
    if (vista) vista.textContent = p.vista;
    if (de) { de.hidden = !p.de; if (p.de) $("s", de).textContent = p.de; }
    if (selo) { selo.hidden = !p.selo; if (p.selo) selo.textContent = p.selo; }
    var off = slot("off");
    if (off) { off.hidden = !p.off; if (p.off) off.textContent = p.off; }

    var btn = $("[data-checkout]", card);
    if (!btn) return;
    btn.href = p.checkout ? comUTM(p.checkout)
      : "https://wa.me/" + CONFIG.whats + "?text=" + encodeURIComponent("Olá! Quero o " + p.nome + " da Mentoria PPPE.");
    btn.addEventListener("click", function () {
      push({ event: "clique_checkout", pagina: CONFIG.pagina, modelo: modelo, plano: id, valor: p.vista });
    });
  });

  /* datas do edital (modelo B) */
  var ed = CONFIG.edital;
  [["ed-publicacao", ed.publicacao], ["ed-inscricoes", ed.inscricoes], ["ed-prova", ed.prova], ["ed-taf", ed.taf]]
    .forEach(function (par) { if (par[1]) $$('[data-slot="' + par[0] + '"]').forEach(function (el) { el.textContent = par[1]; }); });

  /* =========================================================
     3 · A ABERTURA — as duas batidas
     ---------------------------------------------------------
     A cena é toda CSS (ver "O TÍTULO" no styles.css). Aqui só:
       · ouvir o FIM de cada voo (animationend) e soltar, naquele
         quadro, as faíscas, as brasas e a trinca
       · destravar a página quando a cena acaba
       · deixar qualquer toque, tecla ou rolagem pular
     O instante da batida é ESCUTADO, não calculado: o relógio
     do CSS e o performance.now() começam em momentos diferentes.
     ========================================================= */
  var hero = $(".hero");
  var tituloM = document.getElementById("tituloM");
  var tituloP = document.getElementById("tituloP");
  var comAbertura = raiz.classList.contains("is-abertura");
  var saiu = false, pulou = false;

  function sairAbertura(porPulo) {
    if (saiu) return;
    saiu = true;
    try { sessionStorage.setItem("mentoria-abertura", "1"); } catch (e) {}
    raiz.classList.remove("is-entrando");
    if (porPulo) { pulou = true; raiz.classList.add("is-pulado"); }
    window.scrollTo(0, 0);
    ligarObservadores();
  }

  function centro(el, onde) {
    var r = el.getBoundingClientRect(), h = hero.getBoundingClientRect();
    return { x: r.left - h.left + r.width / 2, y: (onde === "topo" ? r.top : r.top + r.height / 2) - h.top, w: r.width, h: r.height };
  }

  function batida1() {
    if (pulou || reduced) return;
    var c = centro(tituloM);
    trincar(c.x, c.y);
    FX.estouro(c.x, c.y, { n: 90, vel: [4, 15], ang: [0, 360], vida: [30, 70], viraBrasa: .35 });
    FX.estouro(c.x - c.w * .42, c.y, { n: 24, vel: [3, 9], ang: [150, 210], vida: [24, 50] });
    FX.estouro(c.x + c.w * .42, c.y, { n: 24, vel: [3, 9], ang: [-30, 30], vida: [24, 50] });
  }
  function batida2() {
    if (pulou || reduced) return;
    var c = centro(tituloP, "topo");
    /* a junção é uma LINHA, não um ponto: as faíscas saem de toda a
       largura do PPPE, a maioria para cima (o MENTORIA foi empurrado) */
    FX.linha(c.x - c.w / 2, c.x + c.w / 2, c.y + c.h * .06, { n: 150 });
    FX.estouro(c.x, c.y, { n: 70, vel: [6, 20], ang: [0, 360], vida: [30, 80], viraBrasa: .5 });
    FX.onda(90);
  }

  if (tituloM) tituloM.addEventListener("animationend", function (e) {
    if (e.target === tituloM && e.animationName === "m-voa") batida1();
  });
  if (tituloP) tituloP.addEventListener("animationend", function (e) {
    if (e.target !== tituloP || e.animationName !== "p-sobe") return;
    batida2();
    if (comAbertura) setTimeout(function () { sairAbertura(false); }, 1150);
  });

  if (comAbertura) {
    var pular = function () { sairAbertura(true); };
    var botaoPular = $(".hero__pular");
    if (botaoPular) botaoPular.addEventListener("click", pular);
    document.addEventListener("click", pular);
    window.addEventListener("wheel", pular, { passive: true, once: true });
    window.addEventListener("touchmove", pular, { passive: true, once: true });
    document.addEventListener("keydown", function (e) {
      if (/^(Escape|Enter| |Tab|ArrowDown|PageDown)$/.test(e.key)) pular();
    });
    /* rede de segurança: aba em segundo plano não roda animação, e a
       entrada não pode virar uma parede */
    setTimeout(pular, 6500);
  }

  /* ─── a trinca no vidro ─────────────────────────────────────
     MENTORIA veio de trás de quem assiste: bate na tela por DENTRO. As
     rachaduras são linhas quebradas saindo do ponto de impacto, com galhos
     e pedaços de anel ligando uma à outra — é o anel que faz ler "vidro". */
  function trincar(cx, cy) {
    var NS = "http://www.w3.org/2000/svg";
    var W = hero.clientWidth, H = hero.clientHeight;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "trinca");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("aria-hidden", "true");
    var alcance = Math.max(W, H) * .42;
    var raios = 11 + Math.floor(Math.random() * 4);
    var pontas = [];

    function rota(ang, r0, r1, passos) {
      var d = "", pts = [];
      for (var i = 0; i <= passos; i++) {
        var r = r0 + (r1 - r0) * (i / passos);
        var a = ang + (Math.random() - .5) * .22;
        var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        pts.push([x, y]);
        d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      }
      return { d: d, pts: pts };
    }
    function traco(d, fina, atraso) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      if (fina) p.setAttribute("class", "fina");
      svg.appendChild(p);
      return { el: p, atraso: atraso };
    }
    var tracos = [];
    for (var i = 0; i < raios; i++) {
      var ang = (i / raios) * Math.PI * 2 + (Math.random() - .5) * .35;
      var r1 = alcance * (.45 + Math.random() * .6);
      var t = rota(ang, 8 + Math.random() * 16, r1, 7 + Math.floor(Math.random() * 4));
      pontas.push({ ang: ang, pts: t.pts });
      tracos.push(traco(t.d, false, Math.random() * .05));
      /* galho */
      if (Math.random() < .7) {
        var base = t.pts[2 + Math.floor(Math.random() * 3)];
        var ga = ang + (Math.random() < .5 ? -1 : 1) * (.35 + Math.random() * .5);
        var gd = "M" + base[0].toFixed(1) + " " + base[1].toFixed(1);
        var gx = base[0], gy = base[1], passo = alcance * (.05 + Math.random() * .05);
        for (var k = 0; k < 4; k++) { ga += (Math.random() - .5) * .4; gx += Math.cos(ga) * passo; gy += Math.sin(ga) * passo; gd += "L" + gx.toFixed(1) + " " + gy.toFixed(1); }
        tracos.push(traco(gd, true, .06 + Math.random() * .06));
      }
    }
    /* pedaços de anel: ligam um raio ao vizinho na mesma "volta" */
    [2, 4].forEach(function (nivel) {
      for (var j = 0; j < pontas.length; j++) {
        if (Math.random() < .45) continue;
        var a = pontas[j].pts[nivel], b = pontas[(j + 1) % pontas.length].pts[nivel];
        if (!a || !b) continue;
        var mx = (a[0] + b[0]) / 2 + (Math.random() - .5) * 14, my = (a[1] + b[1]) / 2 + (Math.random() - .5) * 14;
        tracos.push(traco("M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + "L" + mx.toFixed(1) + " " + my.toFixed(1) + "L" + b[0].toFixed(1) + " " + b[1].toFixed(1), true, .08 + Math.random() * .08));
      }
    });
    hero.appendChild(svg);
    tracos.forEach(function (t) {
      var len = t.el.getTotalLength();
      t.el.style.setProperty("--len", len.toFixed(0));
      t.el.style.animationDelay = t.atraso.toFixed(3) + "s";
    });
    setTimeout(function () { if (svg.parentNode) svg.parentNode.removeChild(svg); }, 2100);
  }

  /* =========================================================
     4 · FX — faíscas e brasas da hero
     ---------------------------------------------------------
     Um canvas só, composto em `lighter` (luz soma com luz). Duas
     populações:
       · BRASAS  sobem devagar, balançando e tremulando, sempre
       · FAÍSCAS nascem nas batidas, riscam rápido com rastro,
         freiam, caem — e uma parte VIRA brasa e sobe (viraBrasa)
     O brilho é um sprite pré-desenhado por cor: shadowBlur por
     partícula derrubaria o celular. Pausa fora da tela.
     ========================================================= */
  var FX = (function () {
    var cv = document.getElementById("fx");
    var nada = { estouro: function () {}, linha: function () {}, onda: function () {} };
    if (!cv || reduced || !cv.getContext) return nada;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, vivo = true, ultimo = 0;
    var CORES = [[255, 240, 205], [240, 220, 176], [201, 174, 122], [230, 150, 80], [196, 112, 63]];
    var sprites = CORES.map(function (c) {
      var s = document.createElement("canvas"); s.width = s.height = 64;
      var g = s.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,250,235,1)");
      gr.addColorStop(.18, "rgba(" + c + ",.95)");
      gr.addColorStop(.45, "rgba(" + c + ",.28)");
      gr.addColorStop(1, "rgba(" + c + ",0)");
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return s;
    });
    var brasas = [], faiscas = [];
    var mobile = window.innerWidth < 640;
    var BASE = mobile ? 38 : 80;

    function medir() {
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function novaBrasa(x, y, forte) {
      return {
        x: x !== undefined ? x : rnd(0, W), y: y !== undefined ? y : rnd(H * .3, H + 20),
        vy: -rnd(.25, forte ? 1.6 : .9), vx: rnd(-.15, .15),
        fase: rnd(0, 6.28), amp: rnd(.2, .8), s: rnd(1.2, forte ? 4 : 3),
        cor: Math.random() < .38 ? 4 : (Math.random() < .5 ? 2 : 1),
        vida: 0, max: rnd(260, 620), pisca: rnd(.04, .12)
      };
    }
    for (var i = 0; i < BASE; i++) { var b = novaBrasa(); b.vida = rnd(0, b.max); brasas.push(b); }

    function estouro(x, y, o) {
      var n = Math.round(o.n * (mobile ? .55 : 1));
      for (var i = 0; i < n; i++) {
        var a = rnd(o.ang[0], o.ang[1]) * Math.PI / 180, v = rnd(o.vel[0], o.vel[1]);
        faiscas.push({
          x: x + rnd(-6, 6), y: y + rnd(-6, 6), px: x, py: y,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          vida: 0, max: rnd(o.vida[0], o.vida[1]), s: rnd(1, 2.6),
          cor: Math.floor(rnd(0, 4.99)), vira: Math.random() < (o.viraBrasa || 0)
        });
      }
    }
    function linha(x1, x2, y, o) {
      var n = Math.round(o.n * (mobile ? .55 : 1));
      for (var i = 0; i < n; i++) {
        var x = rnd(x1, x2);
        /* 75% para cima, o resto espirra para baixo; nas pontas, para fora */
        var ponta = (x - x1) / (x2 - x1);
        var baseAng = Math.random() < .75 ? -90 : 90;
        var desvio = (ponta - .5) * 80;
        var a = (baseAng + desvio + rnd(-35, 35)) * Math.PI / 180, v = rnd(4, 17);
        faiscas.push({ x: x, y: y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0, max: rnd(26, 70), s: rnd(1, 2.4), cor: Math.floor(rnd(0, 4.99)), vira: Math.random() < .3 });
      }
    }
    /* depois da 2ª batida o chão da hero solta brasas fortes por um tempo */
    function onda(n) {
      for (var i = 0; i < Math.round(n * (mobile ? .5 : 1)); i++) {
        (function (d) { setTimeout(function () { brasas.push(novaBrasa(rnd(0, W), H + rnd(0, 40), true)); }, d); })(i * 22);
      }
    }

    function quadro(ts) {
      if (!vivo) { ultimo = 0; return; }
      var dt = ultimo ? Math.min((ts - ultimo) / 16.67, 3) : 1; ultimo = ts;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      /* faíscas: rastro em linha + cabeça em sprite */
      for (var i = faiscas.length - 1; i >= 0; i--) {
        var f = faiscas[i];
        f.px = f.x; f.py = f.y;
        f.vx *= Math.pow(.94, dt); f.vy = f.vy * Math.pow(.94, dt) + .16 * dt;
        f.x += f.vx * dt; f.y += f.vy * dt; f.vida += dt;
        var k = 1 - f.vida / f.max;
        if (k <= 0) {
          if (f.vira) { var nb = novaBrasa(f.x, f.y, true); nb.max = rnd(120, 260); brasas.push(nb); }
          faiscas.splice(i, 1); continue;
        }
        var c = CORES[f.cor];
        ctx.strokeStyle = "rgba(" + c + "," + (k * .9).toFixed(3) + ")";
        ctx.lineWidth = f.s * k + .3;
        ctx.beginPath(); ctx.moveTo(f.x - f.vx * 2.2, f.y - f.vy * 2.2); ctx.lineTo(f.x, f.y); ctx.stroke();
        var t = f.s * 7 * (.5 + k * .5);
        ctx.globalAlpha = k; ctx.drawImage(sprites[f.cor], f.x - t / 2, f.y - t / 2, t, t); ctx.globalAlpha = 1;
      }

      /* brasas */
      for (var j = brasas.length - 1; j >= 0; j--) {
        var b = brasas[j];
        b.vida += dt; b.fase += .03 * dt;
        b.x += (b.vx + Math.sin(b.fase) * b.amp * .5) * dt; b.y += b.vy * dt;
        var p = b.vida / b.max;
        if (p >= 1 || b.y < -20) {
          if (brasas.length > BASE) { brasas.splice(j, 1); continue; }
          brasas[j] = novaBrasa(undefined, H + 10); continue;
        }
        var a = Math.sin(p * Math.PI) * (.55 + Math.sin(b.vida * b.pisca * 6) * .35);
        var tam = b.s * 6;
        ctx.globalAlpha = Math.max(0, a);
        ctx.drawImage(sprites[b.cor], b.x - tam / 2, b.y - tam / 2, tam, tam);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(quadro);
    }

    medir();
    window.addEventListener("resize", medir, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var v = en[0].isIntersecting;
        if (v && !vivo) { vivo = true; requestAnimationFrame(quadro); } else if (!v) vivo = false;
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) vivo = false; else if (!vivo) { vivo = true; requestAnimationFrame(quadro); }
    });
    requestAnimationFrame(quadro);
    return { estouro: estouro, linha: linha, onda: onda };
  })();

  /* =========================================================
     5 · HEADER, PROGRESSO, PARALLAX E DOCK
     ========================================================= */
  var header = document.getElementById("header");
  var progress = document.getElementById("progress");
  var heroBg = document.getElementById("heroBg");
  var tropaFoto = document.getElementById("tropaFoto");
  var dock = document.getElementById("dock");
  var whats = document.getElementById("whats");
  var ticking = false;

  function render() {
    var y = window.scrollY, h = window.innerHeight;
    if (header) header.classList.toggle("is-stuck", y > 40);
    if (progress) {
      var max = document.documentElement.scrollHeight - h;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
    var passouHero = y > h * .85;
    if (dock) dock.classList.toggle("is-on", passouHero);
    if (whats) whats.classList.toggle("is-on", passouHero);
    if (!reduced) {
      if (heroBg && y < h * 1.2) heroBg.style.transform = "translate3d(0," + (y * .16).toFixed(1) + "px,0)";
      if (tropaFoto) {
        var r = tropaFoto.parentNode.getBoundingClientRect();
        if (r.bottom > 0 && r.top < h) tropaFoto.style.transform = "translate3d(0," + (r.top * -.12).toFixed(1) + "px,0)";
      }
    }
    ticking = false;
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  render();

  /* =========================================================
     6 · REVEAL, CORRIDA E NÚMEROS
     Só ligam depois da abertura: um observador não sabe que a
     cena está na frente, e os números contariam sem ninguém ver.
     ========================================================= */
  var ligado = false;
  function ligarObservadores() {
    if (ligado) return;
    ligado = true;
    var alvos = $$(".section__head, .motivo, .corrida, .linha-edital, .vaga, .etapa, .frente, .plat, .duo__foto, .duo__texto, .galeria, .plano, .faq__item, .final__inner");
    if (reduced || !("IntersectionObserver" in window)) {
      $$("[data-corrida]").forEach(function (c) { c.classList.add("is-on"); });
      return;
    }
    alvos.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, irmaos = el.parentNode ? $$(":scope > .reveal", el.parentNode) : [];
        var atraso = Math.max(0, irmaos.indexOf(el)) * 90;
        setTimeout(function () {
          el.classList.add("is-in");
          if (el.hasAttribute("data-corrida")) setTimeout(function () { el.classList.add("is-on"); }, 300);
          /* a classe sai depois da entrada: não briga com o hover */
          setTimeout(function () { el.classList.remove("reveal", "is-in"); }, 1000);
        }, Math.min(atraso, 400));
        io.unobserve(el);
      });
    }, { threshold: .14, rootMargin: "0px 0px -6% 0px" });
    alvos.forEach(function (el) { io.observe(el); });

    var ioNum = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        contar(e.target); ioNum.unobserve(e.target);
      });
    }, { threshold: .6 });
    $$("[data-conta]").forEach(function (el) { ioNum.observe(el); });
  }
  function contar(el) {
    var fim = parseInt(el.getAttribute("data-conta"), 10), suf = el.getAttribute("data-suf") || "";
    var ini = null, DUR = 1400;
    function passo(ts) {
      if (!ini) ini = ts;
      var p = Math.min((ts - ini) / DUR, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(fim * e) + suf;
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }
  if (!comAbertura) ligarObservadores();

  /* =========================================================
     7 · PEÇAS
     ========================================================= */

  /* ─── plataforma: abas trocam o print, com varredura de luz ─── */
  (function plataforma() {
    var caixa = $("[data-plat]");
    if (!caixa) return;
    var abas = $$(".plat__aba", caixa), telas = $$(".plat__vista img", caixa), vista = $(".plat__vista", caixa);
    var atual = 0, timer = null;
    function mostrar(i) {
      atual = (i + abas.length) % abas.length;
      abas.forEach(function (a, k) { a.classList.toggle("is-on", k === atual); a.setAttribute("aria-selected", k === atual); });
      telas.forEach(function (t, k) { t.classList.toggle("is-on", k === atual); });
      vista.classList.remove("is-trocando"); void vista.offsetWidth; vista.classList.add("is-trocando");
    }
    /* O ciclo só roda com a vitrine NA TELA: se ele contasse desde o
       carregamento, quem chegasse aqui já cairia na 3ª ou 4ª aba. Na
       primeira vez que ela aparece, começa da Sala de aula; fora da tela,
       para. Depois que a pessoa escolhe uma aba, o ciclo não volta. */
    var escolheu = false, jaViu = false;
    function parar() { clearInterval(timer); timer = null; }
    function rodar() {
      if (reduced || escolheu || timer) return;
      timer = setInterval(function () { mostrar(atual + 1); }, 5200);
    }
    abas.forEach(function (a, k) {
      a.addEventListener("click", function () { escolheu = true; parar(); mostrar(k); });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) {
          if (!jaViu) { jaViu = true; mostrar(0); }
          rodar();
        } else parar();
      }, { threshold: .35 }).observe(caixa);
    } else rodar();
  })();

  /* ─── galeria de aprovados: duas fileiras, cópia aria-hidden para o laço ─── */
  (function galeria() {
    var alvo = document.getElementById("galeria");
    if (!alvo) return;
    [[1, 7], [8, 14]].forEach(function (faixa, idx) {
      var fila = document.createElement("div");
      fila.className = "fila" + (idx ? " fila--volta" : "");
      var trilho = document.createElement("div");
      trilho.className = "fila__track";
      for (var rep = 0; rep < 2; rep++) {
        for (var n = faixa[0]; n <= faixa[1]; n++) {
          var fig = document.createElement("figure");
          fig.className = "aluno";
          if (rep) fig.setAttribute("aria-hidden", "true");
          var img = new Image(480, 600);
          img.src = "public/alunos/aluno-" + (n < 10 ? "0" : "") + n + ".webp";
          img.loading = "lazy"; img.decoding = "async";
          img.alt = rep ? "" : "Aluno aprovado com o Prof. Everton Mota";
          fig.appendChild(img); trilho.appendChild(fig);
        }
      }
      fila.appendChild(trilho); alvo.appendChild(fila);
    });
  })();

  /* ─── estrelas em volta do Supremo ─── */
  (function estrelas() {
    var alvo = document.getElementById("estrelas");
    if (!alvo || reduced) return;
    /* nas bordas, nunca no meio do texto */
    var pos = [[2, 8], [96, 4], [-1, 38], [99, 30], [3, 70], [97, 64], [8, 96], [92, 94], [50, -1], [30, 2], [70, 100], [100, 84]];
    pos.forEach(function (p, i) {
      var e = document.createElement("i");
      e.className = "estrela";
      e.style.left = p[0] + "%"; e.style.top = p[1] + "%";
      e.style.setProperty("--s", (10 + Math.random() * 12).toFixed(0) + "px");
      e.style.setProperty("--d", (2 + Math.random() * 2).toFixed(2) + "s");
      e.style.setProperty("--a", (i * .37).toFixed(2) + "s");
      alvo.appendChild(e);
    });
  })();

  /* ─── contagem até a prova (modelo B, só com data real) ─── */
  (function contagemProva() {
    var caixa = document.getElementById("contagem");
    if (!caixa || modelo !== "b" || !ed.provaISO) return;
    var alvo = new Date(ed.provaISO).getTime();
    if (isNaN(alvo)) return;
    caixa.hidden = false;
    var cel = { d: $('[data-c="d"]', caixa), h: $('[data-c="h"]', caixa), m: $('[data-c="m"]', caixa), s: $('[data-c="s"]', caixa) };
    function dois(n) { return (n < 10 ? "0" : "") + n; }
    function tique() {
      var r = Math.max(0, alvo - Date.now()) / 1000;
      cel.d.textContent = dois(Math.floor(r / 86400));
      cel.h.textContent = dois(Math.floor(r % 86400 / 3600));
      cel.m.textContent = dois(Math.floor(r % 3600 / 60));
      cel.s.textContent = dois(Math.floor(r % 60));
    }
    tique(); setInterval(tique, 1000);
  })();

  /* ─── brilho seguindo o cursor nas frentes ─── */
  $$(".frente").forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* =========================================================
     8 · ATMOSFERA — brasas da página
     ========================================================= */
  var TONS = ["rgba(201,174,122,.9)", "rgba(175,146,86,.85)", "rgba(196,112,63,.85)"];
  function semear(alvo, quantidade) {
    if (!alvo || reduced) return;
    for (var b = 0; b < quantidade; b++) {
      var br = document.createElement("i");
      br.className = "brasa";
      br.style.setProperty("--x", (Math.random() * 100).toFixed(2) + "%");
      br.style.setProperty("--s", (2 + Math.random() * 3).toFixed(1) + "px");
      br.style.setProperty("--cor", TONS[Math.random() < .34 ? 2 : (Math.random() < .5 ? 0 : 1)]);
      br.style.setProperty("--op", (.35 + Math.random() * .45).toFixed(2));
      br.style.setProperty("--dur", (13 + Math.random() * 13).toFixed(1) + "s");
      br.style.setProperty("--atraso", "-" + (Math.random() * 26).toFixed(1) + "s");
      alvo.appendChild(br);
    }
  }
  semear(document.getElementById("brasas"), window.innerWidth < 640 ? 14 : 24);
  semear(document.getElementById("planosBrasas"), 22);

  var ano = document.getElementById("year");
  if (ano) ano.textContent = new Date().getFullYear();
})();
