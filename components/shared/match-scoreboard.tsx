import { TeamLabel } from "@/components/shared/team-label";
import { cn } from "@/lib/utils";

type MatchScoreboardProps = {
  teamA: string | null;
  teamB: string | null;
  teamASlot?: string | null;
  teamBSlot?: string | null;
  teamAScore: number | null;
  teamBScore: number | null;
  size?: "default" | "compact";
  className?: string;
};

export function MatchScoreboard({
  teamA,
  teamB,
  teamASlot,
  teamBSlot,
  teamAScore,
  teamBScore,
  size = "default",
  className,
}: MatchScoreboardProps) {
  const hasScore = teamAScore !== null && teamBScore !== null;

  return (
    <span
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center font-medium",
        size === "default"
          ? "gap-2 text-sm sm:gap-4 sm:text-lg"
          : "gap-2 text-sm",
        className,
      )}
    >
      <TeamLabel
        team={teamA}
        slot={teamASlot}
        className="min-w-0 flex-row-reverse justify-start text-right"
        textClassName="min-w-0 break-words leading-tight"
      />
      <span className="inline-flex items-center gap-2 font-semibold tabular-nums">
        {hasScore ? <span>{teamAScore}</span> : null}
        <span className="text-slate-400">x</span>
        {hasScore ? <span>{teamBScore}</span> : null}
      </span>
      <TeamLabel
        team={teamB}
        slot={teamBSlot}
        className="min-w-0"
        textClassName="min-w-0 break-words leading-tight"
      />
    </span>
  );
}
