import type { MatchStatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusColors: Record<MatchStatusValue, string> = {
  SCHEDULED: "bg-slate-100 text-slate-700",
  STARTED: "bg-blue-100 text-[#0756ac]",
  FINISHED: "bg-emerald-100 text-[#087543]",
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
        "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none tracking-wide whitespace-nowrap",
        statusColors[status],
      )}
    >
      {children}
    </span>
  );
}
