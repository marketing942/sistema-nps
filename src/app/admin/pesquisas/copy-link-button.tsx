"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function CopyLinkButton({
  slug,
  variant = "icon",
}: {
  slug: string;
  variant?: "icon" | "full";
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/pesquisa/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  if (variant === "full") {
    return (
      <button
        onClick={copy}
        className="flex items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-xs uppercase tracking-widest text-ink-300 hover:border-cppem-green hover:text-cppem-green"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> Link copiado
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copiar link público
          </>
        )}
      </button>
    );
  }
  return (
    <button
      onClick={copy}
      title={copied ? "Copiado!" : "Copiar link público"}
      className="grid h-8 w-8 place-items-center rounded-md border border-ink-700 text-ink-300 hover:border-cppem-green hover:text-cppem-green"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-cppem-green" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
