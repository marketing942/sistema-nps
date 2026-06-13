"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, RefreshCw } from "lucide-react";
import { useMemo } from "react";

interface BU {
  id: string;
  name: string;
}
interface Product {
  id: string;
  name: string;
  business_unit_id: string;
  is_active?: boolean;
}

export default function DashboardFilters({
  businessUnits,
  products,
  current,
}: {
  businessUnits: BU[];
  products: Product[];
  current: {
    bu: string | null;
    product: string | null;
    from: string | null;
    to: string | null;
  };
}) {
  const router = useRouter();
  const search = useSearchParams();

  function update(name: string, value: string | null) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    if (name === "bu") params.delete("product");
    router.push(`?${params.toString()}`);
  }

  const filteredProducts = useMemo(() => {
    if (!current.bu) return products;
    return products.filter((p) => p.business_unit_id === current.bu);
  }, [products, current.bu]);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-ink-800 bg-ink-900 p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-400">
        <Filter className="h-3.5 w-3.5" />
        Filtros
      </div>
      <Select
        label="Unidade"
        value={current.bu ?? ""}
        onChange={(v) => update("bu", v || null)}
        options={[
          { value: "", label: "Todas" },
          ...businessUnits.map((b) => ({ value: b.id, label: b.name })),
        ]}
      />
      <Select
        label="Produto"
        value={current.product ?? ""}
        onChange={(v) => update("product", v || null)}
        options={[
          { value: "", label: "Todos" },
          ...filteredProducts.map((p) => ({ value: p.id, label: p.name })),
        ]}
      />
      <DateInput
        label="De"
        value={current.from ?? ""}
        onChange={(v) => update("from", v || null)}
      />
      <DateInput
        label="Até"
        value={current.to ?? ""}
        onChange={(v) => update("to", v || null)}
      />
      <button
        onClick={() => router.push("?")}
        className="ml-auto flex items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-xs uppercase tracking-widest text-ink-300 hover:border-cppem-green hover:text-cppem-green"
      >
        <RefreshCw className="h-3 w-3" />
        Limpar
      </button>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col text-[11px] uppercase tracking-widest text-ink-400">
      <span className="mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[180px] rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-100 outline-none focus:border-cppem-green"
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

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col text-[11px] uppercase tracking-widest text-ink-400">
      <span className="mb-1">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-100 outline-none focus:border-cppem-green"
      />
    </label>
  );
}
