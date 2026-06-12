"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function TopBar({ email }: { email: string }) {
  const router = useRouter();
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-ink-800 bg-ink-950/85 px-6 backdrop-blur lg:px-10">
      <div className="text-xs uppercase tracking-[0.25em] text-ink-400">
        Painel administrativo
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">{email}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-400">
            Administrador
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-md border border-ink-700 px-3 py-1.5 text-xs uppercase tracking-widest text-ink-300 hover:border-cppem-green hover:text-cppem-green"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </header>
  );
}
