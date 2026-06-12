import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/page-header";
import SurveyEditor from "../survey-editor";

export const dynamic = "force-dynamic";

export default async function NovaPesquisaPage() {
  const supabase = createClient();
  const [{ data: bus }, { data: products }] = await Promise.all([
    supabase.from("business_units").select("id, name, brand_type"),
    supabase
      .from("products")
      .select("id, name, business_unit_id, is_active")
      .eq("is_active", true),
  ]);

  return (
    <>
      <PageHeader
        title="Nova pesquisa"
        description="Defina unidade, produto, tipo, perguntas e gere o link público."
      />
      <SurveyEditor
        businessUnits={bus ?? []}
        products={products ?? []}
      />
    </>
  );
}
