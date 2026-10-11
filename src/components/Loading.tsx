export function PageLoading({ label = 'Carregando informações...' }: { label?: string }) {
  return <div className="page-loading"><span className="spinner" /><span>{label}</span></div>;
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="skeleton-list" aria-label="Carregando tabela">
    {Array.from({ length: rows }).map((_, index) => <div className="skeleton-row" key={index}>
      <span className="skeleton-block skeleton-main" /><span className="skeleton-block skeleton-small" /><span className="skeleton-block skeleton-small" />
    </div>)}
  </div>;
}
