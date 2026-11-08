// Mostrado na hora ao navegar entre módulos do admin enquanto os dados do
// servidor carregam; com ele o Next também pré-busca (prefetch) a rota.
export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="mb-8 border-b border-ink-800 pb-6">
        <div className="h-8 w-72 rounded bg-ink-800" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-ink-800/70" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-xl border border-ink-800 bg-ink-900 lg:col-span-2" />
        <div className="grid gap-4">
          <div className="h-32 rounded-xl border border-ink-800 bg-ink-900" />
          <div className="h-32 rounded-xl border border-ink-800 bg-ink-900" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-ink-800 bg-ink-900" />
        <div className="h-64 rounded-xl border border-ink-800 bg-ink-900" />
      </div>
    </div>
  );
}
