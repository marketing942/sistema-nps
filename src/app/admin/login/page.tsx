"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("E-mail ou senha inválidos.");
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6">
      <div
        className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-900 p-8 shadow-card"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,230,60,0.05), transparent), #101015",
        }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-cppem-green text-cppem-black">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">Central CPPEM</h1>
            <p className="text-xs text-ink-400">
              Acesso restrito · NPS & CSAT
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-ink-300">
              E-mail
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-ink-300">
              Senha
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-green"
            />
          </label>
          {error ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-cppem-green py-2.5 text-sm font-bold uppercase tracking-widest text-cppem-black transition disabled:opacity-60"
          >
            {isPending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-ink-400">
          Crie o usuário admin diretamente no Supabase Auth.
        </p>
      </div>
    </div>
  );
}
