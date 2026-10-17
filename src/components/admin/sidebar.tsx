"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Inbox,
  MessageSquare,
  Boxes,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pesquisas", label: "Pesquisas", icon: ClipboardList },
  { href: "/admin/respostas", label: "Respostas", icon: Inbox },
  { href: "/admin/comentarios", label: "Comentários", icon: MessageSquare },
  { href: "/admin/produtos", label: "Produtos", icon: Boxes },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-900 px-4 py-6 lg:flex">
      <div className="mb-8 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-cppem.png"
          alt="CPPEM"
          className="h-10 w-auto"
        />
        <p className="mt-3 font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-cppem-gold">
          Central de Satisfação
        </p>
        <p className="text-[10px] uppercase tracking-widest text-ink-400">
          NPS · CSAT · Stars
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
                active
                  ? "bg-cppem-gold/10 text-cppem-gold"
                  : "text-ink-300 hover:bg-ink-800 hover:text-ink-100"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-md border border-ink-800 bg-ink-950/60 p-3 text-[11px] leading-relaxed text-ink-400">
        Sistema interno de gestão da satisfação. Compartilhe links públicos
        sem necessidade de login para os respondentes.
      </div>
    </aside>
  );
}
