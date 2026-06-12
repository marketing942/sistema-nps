"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface BU {
  id: string;
  name: string;
  slug: string;
}
interface Product {
  id: string;
  business_unit_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export default function ProductsManager({
  businessUnits,
  initialProducts,
}: {
  businessUnits: BU[];
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [buId, setBuId] = useState(businessUnits[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    if (!name.trim()) return setError("Defina um nome.");
    if (!buId) return setError("Selecione a unidade.");
    startTransition(async () => {
      const supabase = createClient();
      const { data, error: insErr } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          slug: slugify(name),
          description: description.trim() || null,
          business_unit_id: buId,
          is_active: true,
        })
        .select("*")
        .single();
      if (insErr || !data) {
        setError(insErr?.message ?? "Erro ao criar.");
        return;
      }
      setProducts((p) => [...p, data]);
      setName("");
      setDescription("");
      router.refresh();
    });
  }

  function toggle(p: Product) {
    startTransition(async () => {
      const supabase = createClient();
      const { error: upErr } = await supabase
        .from("products")
        .update({ is_active: !p.is_active })
        .eq("id", p.id);
      if (upErr) return;
      setProducts((items) =>
        items.map((it) =>
          it.id === p.id ? { ...it, is_active: !it.is_active } : it
        )
      );
    });
  }

  function remove(p: Product) {
    if (!confirm(`Remover "${p.name}"? Isso não pode ser desfeito.`)) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("products")
        .delete()
        .eq("id", p.id);
      if (delErr) return;
      setProducts((items) => items.filter((it) => it.id !== p.id));
    });
  }

  const grouped = businessUnits.map((bu) => ({
    bu,
    products: products.filter((p) => p.business_unit_id === bu.id),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-ink-800 bg-ink-900 p-5 lg:col-span-1">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
          Novo produto / público
        </h2>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-400">
            Unidade
          </span>
          <select
            value={buId}
            onChange={(e) => setBuId(e.target.value)}
            className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
          >
            {businessUnits.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-400">
            Nome
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Mentoria 2026"
            className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-400">
            Descrição
          </span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional"
            className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
          />
        </label>
        {error ? (
          <p className="mt-3 text-xs text-rose-300">{error}</p>
        ) : null}
        <button
          onClick={add}
          disabled={isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-cppem-green py-2.5 text-sm font-bold uppercase tracking-widest text-cppem-black disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      <div className="space-y-5 lg:col-span-2">
        {grouped.map(({ bu, products }) => (
          <div
            key={bu.id}
            className="rounded-xl border border-ink-800 bg-ink-900"
          >
            <div className="border-b border-ink-800 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
              {bu.name}
            </div>
            {products.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-400">
                Nenhum produto cadastrado para esta unidade.
              </p>
            ) : (
              <ul className="divide-y divide-ink-800">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{p.name}</p>
                      {p.description ? (
                        <p className="truncate text-xs text-ink-400">
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => toggle(p)}
                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] uppercase tracking-widest ${
                          p.is_active
                            ? "border-emerald-500/40 text-emerald-300"
                            : "border-ink-700 text-ink-400"
                        }`}
                      >
                        {p.is_active ? (
                          <ToggleRight className="h-3.5 w-3.5" />
                        ) : (
                          <ToggleLeft className="h-3.5 w-3.5" />
                        )}
                        {p.is_active ? "Ativo" : "Inativo"}
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="grid h-7 w-7 place-items-center rounded-md border border-ink-700 text-ink-400 hover:border-rose-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
