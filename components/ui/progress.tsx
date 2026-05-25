export function Progress({ value }: { value: number }) {
  const safeValue = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      aria-label={`Accuracy ${safeValue}%`}
    >
      <div
        className="h-full rounded-full bg-emerald-700"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
