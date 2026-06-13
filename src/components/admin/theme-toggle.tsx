"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/use-theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";
  return (
    <button
      onClick={toggle}
      title={isLight ? "Modo escuro" : "Modo claro"}
      aria-label={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
      className="grid h-8 w-8 place-items-center rounded-md border border-ink-700 text-ink-300 transition hover:border-cppem-green hover:text-cppem-green"
    >
      {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
    </button>
  );
}
