export function LoadingIndicator({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`app-loading-indicator ${compact ? "compact" : ""}`} role="status" aria-live="polite">
      <span className="app-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
