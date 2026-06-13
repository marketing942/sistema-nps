import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { Download } from "lucide-react";
import Link from "next/link";
import DeleteButton from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

interface SearchParams {
  bu?: string;
  survey?: string;
}

export default async function RespostasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const [{ data: bus }, { data: surveys }] = await Promise.all([
    supabase.from("business_units").select("id, name"),
    supabase
      .from("surveys")
      .select("id, name, business_unit_id")
      .order("name"),
  ]);

  let query = supabase
    .from("survey_responses")
    .select(
      `id, submitted_at, respondent_name, respondent_email, respondent_phone, respondent_type,
       survey:surveys(id, name),
       business_unit:business_units(id, name),
       product:products(name)`
    )
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (searchParams.bu) query = query.eq("business_unit_id", searchParams.bu);
  if (searchParams.survey) query = query.eq("survey_id", searchParams.survey);

  const { data: responses } = await query;

  const exportParams = new URLSearchParams();
  if (searchParams.bu) exportParams.set("bu", searchParams.bu);
  if (searchParams.survey) exportParams.set("survey", searchParams.survey);

  return (
    <>
      <PageHeader
        title="Respostas"
        description="Todas as respostas recebidas pelas pesquisas. Exporte para CSV quando precisar."
        action={
          <Link
            href={`/api/export/responses?${exportParams.toString()}`}
            className="flex items-center gap-2 rounded-md bg-cppem-green px-4 py-2 text-sm font-bold uppercase tracking-widest text-cppem-black"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </Link>
        }
      />

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-ink-800 bg-ink-900 p-4">
        <FormSelect
          name="bu"
          label="Unidade"
          value={searchParams.bu ?? ""}
          options={[
            { value: "", label: "Todas" },
            ...(bus ?? []).map((b: any) => ({ value: b.id, label: b.name })),
          ]}
        />
        <FormSelect
          name="survey"
          label="Pesquisa"
          value={searchParams.survey ?? ""}
          options={[
            { value: "", label: "Todas" },
            ...(surveys ?? []).map((s: any) => ({
              value: s.id,
              label: s.name,
            })),
          ]}
        />
        <button className="rounded-md border border-ink-700 px-3 py-2 text-xs uppercase tracking-widest text-ink-300 hover:border-cppem-green hover:text-cppem-green">
          Aplicar
        </button>
      </form>

      {!responses || responses.length === 0 ? (
        <EmptyState
          title="Nenhuma resposta encontrada"
          description="Compartilhe os links públicos das pesquisas para começar a coletar."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-800">
          <table className="w-full text-sm">
            <thead className="bg-ink-900 text-[10px] uppercase tracking-widest text-ink-400">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Pesquisa</th>
                <th className="px-4 py-3 text-left">Unidade · Produto</th>
                <th className="px-4 py-3 text-left">Respondente</th>
                <th className="px-4 py-3 text-left">Contato</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800 bg-ink-900/40">
              {responses.map((r: any) => {
                const survey = Array.isArray(r.survey)
                  ? r.survey[0]
                  : r.survey;
                const bu = Array.isArray(r.business_unit)
                  ? r.business_unit[0]
                  : r.business_unit;
                const product = Array.isArray(r.product)
                  ? r.product?.[0]
                  : r.product;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-ink-300">
                      {formatDateTime(r.submitted_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pesquisas/${survey?.id}?tab=responses`}
                        className="font-semibold hover:text-cppem-green"
                      >
                        {survey?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-300">
                      <p>{bu?.name ?? "—"}</p>
                      <p className="text-xs text-ink-400">
                        {product?.name ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {r.respondent_name || (
                        <span className="text-ink-400">Anônimo</span>
                      )}
                      {r.respondent_type ? (
                        <p className="text-[10px] uppercase tracking-widest text-ink-400">
                          {r.respondent_type}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-400">
                      <p>{r.respondent_email ?? "—"}</p>
                      <p className="text-xs">{r.respondent_phone ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <DeleteButton
                          table="survey_responses"
                          id={r.id}
                          label="Excluir resposta"
                          confirmText="Excluir esta resposta? Esta ação não pode ser desfeita."
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FormSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col text-[11px] uppercase tracking-widest text-ink-400">
      <span className="mb-1">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="min-w-[200px] rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-cppem-green"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
