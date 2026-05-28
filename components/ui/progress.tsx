export function Progress({
  value,
  ariaLabel,
}: {
  value: number;
  ariaLabel?: string;
}) {
  const safeValue = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      aria-label={ariaLabel ?? `Precisão ${safeValue}%`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#0e74e1] to-[#099d57]"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
