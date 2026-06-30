import { TeamLabel } from "@/components/shared/team-label";
import type { MatchStageValue } from "@/lib/constants";
import { officialMatchOutcomeLabel } from "@/lib/match-outcome";
import { cn } from "@/lib/utils";

export function OfficialMatchOutcome({
  stage,
  advancingTeam,
  linkToTeamMatches = false,
  className,
}: {
  stage: MatchStageValue;
  advancingTeam: string | null;
  linkToTeamMatches?: boolean;
  className?: string;
}) {
  const label = officialMatchOutcomeLabel(stage, advancingTeam);

  if (!label || !advancingTeam) {
    return null;
  }

  return (
    <p
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-1 text-xs font-medium text-emerald-800",
        className,
      )}
    >
      <span>{label}:</span>
      <TeamLabel
        team={advancingTeam}
        linkToTeamMatches={linkToTeamMatches}
        className="min-w-0"
        textClassName="min-w-0 break-words"
      />
    </p>
  );
}
