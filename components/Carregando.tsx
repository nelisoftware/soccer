export function Carregando() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Carregando">
      <div className="h-4 w-24 rounded bg-surface-2" />
      <div className="h-8 w-56 rounded bg-surface-2" />
      <div className="h-40 rounded-2xl bg-surface-2" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-48 rounded-2xl bg-surface-2" />
        <div className="h-48 rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}
