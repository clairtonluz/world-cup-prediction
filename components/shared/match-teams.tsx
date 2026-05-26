import { TeamLabel } from "@/components/shared/team-label";
import { cn } from "@/lib/utils";

export function MatchTeams({
  teamA,
  teamB,
  teamASlot,
  teamBSlot,
  className,
}: {
  teamA: string | null;
  teamB: string | null;
  teamASlot?: string | null;
  teamBSlot?: string | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <TeamLabel team={teamA} slot={teamASlot} />
      <span className="text-slate-400">x</span>
      <TeamLabel team={teamB} slot={teamBSlot} />
    </span>
  );
}
