import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type PodiumPosition = 1 | 2 | 3;

const podiumPositionStyles: Record<
  PodiumPosition,
  {
    label: string;
    badgeClassName: string;
    iconClassName: string;
    rowClassName: string;
  }
> = {
  1: {
    label: "Troféu de ouro: 1º colocado",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    iconClassName: "text-amber-500",
    rowClassName: "bg-amber-50/70 font-medium",
  },
  2: {
    label: "Troféu de prata: 2º colocado",
    badgeClassName: "border-slate-300 bg-slate-50 text-slate-700",
    iconClassName: "text-slate-500",
    rowClassName: "bg-slate-50 font-medium",
  },
  3: {
    label: "Troféu de bronze: 3º colocado",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    iconClassName: "text-orange-600",
    rowClassName: "bg-orange-50/70 font-medium",
  },
};

export function RankingPosition({
  position,
  className,
}: {
  position: number;
  className?: string;
}) {
  const podiumPosition = getPodiumPosition(position);

  if (!podiumPosition) {
    return (
      <span
        className={cn(
          "inline-flex min-w-8 items-center font-medium text-slate-700",
          className,
        )}
      >
        #{position}
      </span>
    );
  }

  const positionStyle = podiumPositionStyles[podiumPosition];

  return (
    <span
      aria-label={positionStyle.label}
      title={positionStyle.label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none shadow-sm",
        positionStyle.badgeClassName,
        className,
      )}
    >
      <Trophy className={cn("size-4", positionStyle.iconClassName)} aria-hidden="true" />
      <span>#{position}</span>
    </span>
  );
}

export function getPodiumRowClassName(position: number) {
  const podiumPosition = getPodiumPosition(position);

  return podiumPosition
    ? podiumPositionStyles[podiumPosition].rowClassName
    : null;
}

function getPodiumPosition(position: number): PodiumPosition | null {
  if (position === 1 || position === 2 || position === 3) {
    return position;
  }

  return null;
}
