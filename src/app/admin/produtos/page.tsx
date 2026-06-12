import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/page-header";
import ProductsManager from "./products-manager";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const supabase = createClient();
  const [{ data: bus }, { data: products }] = await Promise.all([
    supabase.from("business_units").select("id, name, brand_type, slug"),
    supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  return (
    <>
      <PageHeader
        title="Produtos e públicos"
        description="Cadastre os produtos e públicos de cada unidade. Eles podem ser vinculados às pesquisas."
      />
      <ProductsManager
        businessUnits={bus ?? []}
        initialProducts={products ?? []}
      />
    </>
  );
}
