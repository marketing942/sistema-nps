import { Inbox } from "lucide-react";

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-800 bg-ink-900/40 p-12 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-ink-800 text-ink-300">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
