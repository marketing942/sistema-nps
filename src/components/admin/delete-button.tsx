"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  table: "surveys" | "survey_responses" | "products";
  id: string;
  label?: string;
  confirmText: string;
  redirectTo?: string;
  variant?: "icon" | "full";
}

export default function DeleteButton({
  table,
  id,
  label = "Excluir",
  confirmText,
  redirectTo,
  variant = "icon",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    if (typeof window === "undefined") return;
    if (!window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: delErr } = await supabase.from(table).delete().eq("id", id);
      if (delErr) {
        setError(delErr.message);
        window.alert(
          `Não foi possível excluir: ${delErr.message}\n\nSe a mensagem mencionar policy/RLS, rode supabase/migrations/001_delete_policies.sql no Supabase.`
        );
        return;
      }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  if (variant === "full") {
    return (
      <button
        onClick={handle}
        disabled={isPending}
        className="flex items-center gap-2 rounded-md border border-rose-500/40 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isPending ? "Excluindo..." : label}
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-md border border-ink-700 text-ink-400 transition hover:border-rose-500 hover:text-rose-400 disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
