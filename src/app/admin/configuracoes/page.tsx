import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: bus } = await supabase
    .from("business_units")
    .select("*")
    .order("name");

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Conta administradora e unidades de negócio cadastradas."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-800 bg-ink-900 p-6">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
            Conta
          </h2>
          <p className="text-sm">{user?.email}</p>
          <p className="mt-1 text-xs text-ink-400">
            Crie e gerencie usuários administrativos diretamente no Supabase
            Auth.
          </p>
        </div>

        <div className="rounded-xl border border-ink-800 bg-ink-900 p-6">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
            Unidades de negócio
          </h2>
          <ul className="space-y-2">
            {(bus ?? []).map((b: any) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-md border border-ink-800 bg-ink-950/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink-400">
                    {b.brand_type} · /{b.slug}
                  </p>
                </div>
                <span
                  className="inline-block h-4 w-4 rounded-full border border-ink-700"
                  style={{ background: b.primary_color ?? "#000" }}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-400">
            Para alterar logos ou cores, edite diretamente na tabela{" "}
            <code>business_units</code> no Supabase.
          </p>
        </div>

        <div className="rounded-xl border border-ink-800 bg-ink-900 p-6 lg:col-span-2">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
            Regras de classificação
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <RuleCard
              title="NPS"
              rows={[
                ["9–10", "Promotor"],
                ["7–8", "Neutro"],
                ["0–6", "Detrator"],
              ]}
            />
            <RuleCard
              title="Estrelas"
              rows={[
                ["5", "Promotor"],
                ["4", "Neutro"],
                ["1–3", "Detrator"],
              ]}
            />
            <RuleCard
              title="CSAT"
              rows={[
                ["4–5", "Satisfeito"],
                ["3", "Neutro"],
                ["1–2", "Insatisfeito"],
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function RuleCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-md border border-ink-800 bg-ink-950/40 p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-cppem-green">
        {title}
      </p>
      <ul className="space-y-1.5">
        {rows.map(([k, v]) => (
          <li key={k} className="flex justify-between text-sm">
            <span className="text-ink-300">{k}</span>
            <span className="font-semibold">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
