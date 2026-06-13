import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number | null;
  hint?: string;
  tone?: "good" | "neutral" | "bad" | "default";
  big?: boolean;
}

export default function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  big = false,
}: Props) {
  const toneClass = {
    good: "text-emerald-400",
    bad: "text-rose-400",
    neutral: "text-amber-400",
    default: "text-ink-100",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-xl border border-ink-800 bg-ink-900 p-5 shadow-card",
        big && "p-7"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        {label}
      </p>
      <div className="mt-3 flex items-end gap-2">
        <span
          className={cn(
            "font-display font-bold tabular-nums leading-none",
            big ? "text-5xl" : "text-3xl",
            toneClass
          )}
        >
          {value === null || value === undefined || value === ""
            ? "—"
            : value}
        </span>
      </div>
      {hint ? (
        <p className="mt-2 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}
