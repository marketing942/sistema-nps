import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  basePath: string;
  params?: Record<string, string | null | undefined>;
  page: number;
  pageSize: number;
  total: number;
}

export default function Pagination({
  basePath,
  params = {},
  page,
  pageSize,
  total,
}: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  function href(p: number) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const btn =
    "flex items-center gap-1 rounded-md border border-ink-700 px-3 py-2 text-xs uppercase tracking-widest";
  const on = "text-ink-300 hover:border-cppem-gold hover:text-cppem-gold";
  const off = "pointer-events-none text-ink-500 opacity-50";

  return (
    <nav
      className="mt-6 flex items-center justify-between"
      aria-label="Paginação"
    >
      <Link
        href={href(page - 1)}
        aria-disabled={page <= 1}
        className={`${btn} ${page <= 1 ? off : on}`}
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Anterior
      </Link>
      <span className="text-xs uppercase tracking-widest text-ink-400">
        Página {page} de {pages} · {total} no total
      </span>
      <Link
        href={href(page + 1)}
        aria-disabled={page >= pages}
        className={`${btn} ${page >= pages ? off : on}`}
      >
        Próxima <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </nav>
  );
}
