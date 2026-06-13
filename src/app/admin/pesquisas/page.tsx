import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { Plus, ExternalLink } from "lucide-react";
import CopyLinkButton from "./copy-link-button";
import DeleteButton from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function PesquisasPage() {
  const supabase = createClient();
  const { data: surveys } = await supabase
    .from("surveys")
    .select(
      `id, name, slug, survey_type, is_active, created_at,
       business_unit:business_units(name, brand_type),
       product:products(name)`
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Pesquisas"
        description="Crie, edite e ative pesquisas. Cada pesquisa tem um link público único."
        action={
          <Link
            href="/admin/pesquisas/nova"
            className="flex items-center gap-2 rounded-md bg-cppem-green px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-cppem-black transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nova pesquisa
          </Link>
        }
      />

      {!surveys || surveys.length === 0 ? (
        <EmptyState
          title="Nenhuma pesquisa criada"
          description="Crie sua primeira pesquisa para começar a coletar respostas."
          action={
            <Link
              href="/admin/pesquisas/nova"
              className="inline-flex items-center gap-2 rounded-md bg-cppem-green px-4 py-2 text-sm font-bold uppercase tracking-widest text-cppem-black"
            >
              <Plus className="h-4 w-4" />
              Criar pesquisa
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-800">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/80 text-[10px] uppercase tracking-[0.2em] text-ink-400">
              <tr>
                <th className="px-4 py-3 text-left">Pesquisa</th>
                <th className="px-4 py-3 text-left">Unidade · Produto</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Criada</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800 bg-ink-900/40">
              {surveys.map((s: any) => {
                const bu = Array.isArray(s.business_unit)
                  ? s.business_unit[0]
                  : s.business_unit;
                const product = Array.isArray(s.product)
                  ? s.product?.[0]
                  : s.product;
                const publicUrl = `/pesquisa/${s.slug}`;
                return (
                  <tr key={s.id} className="hover:bg-ink-900/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pesquisas/${s.id}`}
                        className="font-semibold hover:text-cppem-green"
                      >
                        {s.name}
                      </Link>
                      <p className="text-xs text-ink-400">/{s.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-300">
                      <p>{bu?.name ?? "—"}</p>
                      <p className="text-xs text-ink-400">
                        {product?.name ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-300">
                      <span className="rounded-md border border-ink-700 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                        {labelType(s.survey_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={s.is_active} />
                    </td>
                    <td className="px-4 py-3 text-ink-400">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CopyLinkButton slug={s.slug} />
                        <Link
                          href={publicUrl}
                          target="_blank"
                          className="grid h-8 w-8 place-items-center rounded-md border border-ink-700 text-ink-300 hover:border-cppem-green hover:text-cppem-green"
                          title="Abrir link público"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <DeleteButton
                          table="surveys"
                          id={s.id}
                          label="Excluir pesquisa"
                          confirmText={`Excluir a pesquisa "${s.name}"? Todas as perguntas e respostas serão removidas permanentemente.`}
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

function labelType(t: string) {
  return (
    { nps: "NPS", csat: "CSAT", stars: "Estrelas", mixed: "Mista" } as any
  )[t] ?? t;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-ink-800 text-ink-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-400" : "bg-ink-400"
        }`}
      />
      {active ? "Ativa" : "Inativa"}
    </span>
  );
}
