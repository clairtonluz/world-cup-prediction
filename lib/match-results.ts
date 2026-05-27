import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { MatchStageValue } from "@/lib/constants";
import { calculatePredictionPoints } from "@/lib/scoring";

type ScoredMatch = {
  id: string;
  stage: string;
  teamAScore: number | null;
  teamBScore: number | null;
  advancingTeam: string | null;
};

export async function recalculateMatchPredictions(
  tx: Prisma.TransactionClient,
  match: ScoredMatch,
) {
  if (match.teamAScore === null || match.teamBScore === null) {
    await tx.prediction.updateMany({ where: { matchId: match.id }, data: { points: 0 } });
    return;
  }

  const predictions = await tx.prediction.findMany({ where: { matchId: match.id } });
  for (const prediction of predictions) {
    const result = calculatePredictionPoints(prediction, {
      stage: match.stage as MatchStageValue,
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      advancingTeam: match.advancingTeam,
    });
    await tx.prediction.update({
      where: { id: prediction.id },
      data: { points: result.points },
    });
  }
}
