import "server-only";

import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { mayEditChampionPrediction } from "@/lib/tournament-predictions";

export async function getChampionPredictionFormData() {
  const { user } = await requireUser();
  const db = getDb();
  const [participant, openingMatch, groupMatches] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { predictedChampion: true },
    }),
    db.match.findFirst({
      select: { startsAt: true, status: true },
      orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }],
    }),
    db.match.findMany({
      where: { stage: "GROUP_STAGE", participantsConfirmed: true },
      select: { teamA: true, teamB: true },
    }),
  ]);

  const teams = [
    ...new Set(
      groupMatches.flatMap((match) => [match.teamA, match.teamB]).filter(isTeam),
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return {
    predictedChampion: participant.predictedChampion,
    teams,
    editable: mayEditChampionPrediction(openingMatch),
    closesAt: openingMatch?.startsAt ?? null,
  };
}

function isTeam(team: string | null): team is string {
  return team !== null;
}
