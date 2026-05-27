import { TeamLabel } from "@/components/shared/team-label";

type MatchScoreboardProps = {
  teamA: string | null;
  teamB: string | null;
  teamASlot?: string | null;
  teamBSlot?: string | null;
  teamAScore: number | null;
  teamBScore: number | null;
};

export function MatchScoreboard({
  teamA,
  teamB,
  teamASlot,
  teamBSlot,
  teamAScore,
  teamBScore,
}: MatchScoreboardProps) {
  const hasScore = teamAScore !== null && teamBScore !== null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm font-medium sm:gap-4 sm:text-lg">
      <TeamLabel
        team={teamA}
        slot={teamASlot}
        className="min-w-0 flex-row-reverse justify-start text-right"
      />
      <span className="inline-flex items-center gap-2 font-semibold tabular-nums">
        {hasScore ? <span>{teamAScore}</span> : null}
        <span className="text-slate-400">x</span>
        {hasScore ? <span>{teamBScore}</span> : null}
      </span>
      <TeamLabel team={teamB} slot={teamBSlot} className="min-w-0" />
    </div>
  );
}
