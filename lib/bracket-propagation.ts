import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { resolveBracketParticipants, type BracketMatch } from "@/lib/bracket";

export type PropagationResult = {
  updatedMatches: number;
  invalidatedPredictions: number;
  blockedMatches: number;
};

export async function propagateFutureParticipants(
  tx: Prisma.TransactionClient,
  now = new Date(),
): Promise<PropagationResult> {
  const matches = await tx.match.findMany({
    select: {
      id: true,
      matchNumber: true,
      stage: true,
      status: true,
      startsAt: true,
      teamA: true,
      teamB: true,
      teamASlot: true,
      teamBSlot: true,
      groupCode: true,
      teamAScore: true,
      teamBScore: true,
      advancingTeam: true,
      participantsConfirmed: true,
    },
    orderBy: { matchNumber: "asc" },
  });
  const resolutions = resolveBracketParticipants(matches as BracketMatch[]);
  const result: PropagationResult = {
    updatedMatches: 0,
    invalidatedPredictions: 0,
    blockedMatches: 0,
  };

  for (const match of matches) {
    const resolution = resolutions.get(match.matchNumber);
    if (!resolution) {
      continue;
    }

    const teamsChanged =
      match.teamA !== resolution.teamA || match.teamB !== resolution.teamB;
    const confirmationChanged =
      match.participantsConfirmed !== resolution.participantsConfirmed;
    if (!teamsChanged && !confirmationChanged) {
      continue;
    }

    if (match.status !== "SCHEDULED" || match.startsAt.getTime() <= now.getTime()) {
      result.blockedMatches += 1;
      continue;
    }

    let predictionsResetAt: Date | undefined;
    if (teamsChanged) {
      const deletion = await tx.prediction.deleteMany({ where: { matchId: match.id } });
      result.invalidatedPredictions += deletion.count;
      if (deletion.count > 0) {
        predictionsResetAt = now;
      }
    }

    await tx.match.update({
      where: { id: match.id },
      data: {
        teamA: resolution.teamA,
        teamB: resolution.teamB,
        participantsConfirmed: resolution.participantsConfirmed,
        predictionsResetAt,
      },
    });
    result.updatedMatches += 1;
  }

  return result;
}
