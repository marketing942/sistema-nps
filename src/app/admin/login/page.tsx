"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
      <div className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-900 p-8 shadow-card">
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-cppem.png" alt="CPPEM" className="h-12 w-auto" />
          <h1 className="mt-4 font-display text-lg font-bold uppercase tracking-wide">
            Central de Satisfação
          </h1>
          <p className="text-xs text-ink-400">Acesso restrito · NPS & CSAT</p>
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
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-gold"
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
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-cppem-gold"
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
            className="w-full rounded-md bg-cppem-gold-solid py-2.5 text-sm font-bold uppercase tracking-widest text-cppem-bg transition disabled:opacity-60"
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
