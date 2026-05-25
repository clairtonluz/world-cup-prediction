import type { MatchStatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusColors: Record<MatchStatusValue, string> = {
  SCHEDULED: "bg-sky-100 text-sky-800",
  STARTED: "bg-amber-100 text-amber-900",
  FINISHED: "bg-emerald-100 text-emerald-900",
};

export function StatusBadge({
  status,
  children,
}: {
  status: MatchStatusValue;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusColors[status],
      )}
    >
      {children}
    </span>
  );
}
