import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBrand } from "@/lib/brands";
import { CheckCircle2, Gift, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

const REFERRAL_LINKS: Record<"cppem" | "colegio", string> = {
  cppem: "https://links.cppem.com.br/cppem-indique",
  colegio: "https://links.cppem.com.br/colegio-indique",
};

export default async function ObrigadoPage({ params }: Props) {
  const supabase = createClient();
  const { data: survey } = await supabase
    .from("surveys")
    .select("name, business_unit:business_units(name, brand_type, logo_url)")
    .eq("slug", params.slug)
    .maybeSingle();

  const bu = Array.isArray(survey?.business_unit)
    ? survey?.business_unit[0]
    : (survey?.business_unit as any);
  const brand = getBrand(bu?.brand_type);
  const referralUrl = REFERRAL_LINKS[brand.type];

  return (
    <div className={`brand-${brand.type} min-h-screen`}>
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 py-10 text-center">
        {bu?.logo_url ? (
          <img
            src={bu.logo_url}
            alt={bu.name}
            className="mb-6 h-20 w-20 object-contain"
          />
        ) : null}
        <CheckCircle2 className="b-primary-text mb-4 h-14 w-14" />
        <h1 className="b-display text-3xl font-bold sm:text-4xl">
          Obrigado pela sua resposta.
        </h1>
        <p className="b-muted mt-4 max-w-md text-base leading-relaxed">
          Sua opinião ajuda o {bu?.name ?? "CPPEM"} a melhorar todos os dias.
          Recebemos sua resposta com sucesso.
        </p>

        {/* Programa de indicação */}
        <div className="b-card-surface mt-10 w-full max-w-md rounded-xl p-6 text-left sm:p-7">
          <div className="mb-3 flex items-center gap-2">
            <Gift className="b-primary-text h-4 w-4" />
            <span className="b-primary-text text-[11px] font-bold uppercase tracking-[0.2em]">
              Programa de indicação
            </span>
          </div>
          <h2 className="b-display text-xl font-bold leading-snug sm:text-2xl">
            Indique amigos e ganhe benefícios exclusivos.
          </h2>
          <p className="b-muted mt-3 text-sm leading-relaxed">
            Já que você chegou até aqui, que tal levar quem você ama junto?
            Participe do nosso programa de indicação, indique mais amigos
            para o {bu?.name ?? "CPPEM"} e desbloqueie vantagens exclusivas
            por cada indicação.
          </p>
          <a
            href={referralUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="b-primary-bg b-display mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-bold uppercase tracking-[0.15em] transition hover:opacity-90"
          >
            Quero indicar e ganhar
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="b-muted mt-3 text-[11px] uppercase tracking-widest">
            Saiba como funciona ao acessar o link.
          </p>
        </div>

        <Link
          href="/"
          className="b-primary-text mt-8 text-[11px] uppercase tracking-[0.25em] opacity-70 hover:opacity-100"
        >
          ← Fechar
        </Link>
      </div>
    </div>
  );
}
