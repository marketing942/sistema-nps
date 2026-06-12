import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBrand } from "@/lib/brands";
import SurveyForm from "./survey-form";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default async function PublicSurveyPage({ params }: Props) {
  const supabase = createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select(
      `id, name, slug, description, audience, is_active,
       business_unit:business_units(id, name, brand_type, logo_url),
       product:products(id, name)`
    )
    .eq("slug", params.slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!survey) notFound();

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("survey_id", survey.id)
    .order("order_index", { ascending: true });

  const bu = Array.isArray(survey.business_unit)
    ? survey.business_unit[0]
    : (survey.business_unit as any);
  const product = Array.isArray(survey.product)
    ? survey.product?.[0]
    : (survey.product as any);
  const brand = getBrand(bu?.brand_type);

  return (
    <div className={`brand-${brand.type} min-h-screen`}>
      <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <header className="mb-8 flex flex-col items-center text-center">
          {bu?.logo_url ? (
            <img
              src={bu.logo_url}
              alt={bu.name}
              className="mb-5 h-20 w-20 object-contain"
            />
          ) : null}
          <p className="b-primary-text text-[11px] font-semibold uppercase tracking-[0.25em]">
            {bu?.name ?? "CPPEM"}
          </p>
          <h1 className="b-display mt-3 text-3xl sm:text-4xl font-bold">
            {survey.name}
          </h1>
          {product?.name ? (
            <p className="b-muted mt-2 text-sm uppercase tracking-wider">
              {product.name}
            </p>
          ) : null}
          {survey.description ? (
            <p className="b-muted mt-4 max-w-md text-base leading-relaxed">
              {survey.description}
            </p>
          ) : (
            <p className="b-muted mt-4 max-w-md text-base leading-relaxed">
              Sua opinião é muito importante para melhorarmos sua experiência
              com o {bu?.name ?? "CPPEM"}. Responda em poucos segundos.
            </p>
          )}
        </header>

        <SurveyForm
          surveyId={survey.id}
          surveySlug={survey.slug}
          businessUnitId={bu?.id}
          productId={product?.id ?? null}
          questions={questions ?? []}
          brandType={brand.type}
        />

        <footer className="mt-10 text-center">
          <p className="b-muted text-[11px] uppercase tracking-[0.2em]">
            CPPEM · Central de Satisfação
          </p>
        </footer>
      </div>
    </div>
  );
}
