import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBrand } from "@/lib/brands";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default async function ObrigadoPage({ params }: Props) {
  const supabase = createClient();
  const { data: survey } = await supabase
    .from("surveys")
    .select(
      "name, business_unit:business_units(name, brand_type, logo_url)"
    )
    .eq("slug", params.slug)
    .maybeSingle();

  const bu = Array.isArray(survey?.business_unit)
    ? survey?.business_unit[0]
    : (survey?.business_unit as any);
  const brand = getBrand(bu?.brand_type);

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
        <h1 className="b-display text-3xl sm:text-4xl font-bold">
          Obrigado pela sua resposta.
        </h1>
        <p className="b-muted mt-4 max-w-md text-base leading-relaxed">
          Sua opinião ajuda o {bu?.name ?? "CPPEM"} a melhorar todos os dias.
          Recebemos sua resposta com sucesso.
        </p>
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
