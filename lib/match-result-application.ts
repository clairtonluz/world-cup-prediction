import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  matchStartUpdateError,
  updatedMatchError,
} from "@/lib/admin-match-policy";
import { propagateFutureParticipants, type PropagationResult } from "@/lib/bracket-propagation";
import type { MatchStatusValue } from "@/lib/constants";
import type { ErrorFeedbackCode } from "@/lib/feedback";
import { recalculateMatchPredictions } from "@/lib/match-results";

export type MatchResultUpdate = {
  status: MatchStatusValue;
  teamAScore: number | null;
  teamBScore: number | null;
  advancingTeam: string | null;
};

type MatchUpdate = MatchResultUpdate & {
  startsAt?: Date;
};

export type ApplyMatchResultResult = {
  error: ErrorFeedbackCode | null;
  propagation: PropagationResult | null;
};

export async function applyMatchResult(
  tx: Prisma.TransactionClient,
  matchId: string,
  result: MatchUpdate,
): Promise<ApplyMatchResultResult> {
  const existing = await tx.match.findUnique({ where: { id: matchId } });
  if (!existing) {
    return { error: "match_not_found", propagation: null };
  }

  const policyError = updatedMatchError(existing, result);
  if (policyError) {
    return { error: policyError, propagation: null };
  }

  if (
    result.startsAt &&
    existing.startsAt.getTime() !== result.startsAt.getTime()
  ) {
    const startUpdateError = matchStartUpdateError(existing);
    if (startUpdateError) {
      return { error: startUpdateError, propagation: null };
    }
  }

  if (result.status !== "SCHEDULED" && !existing.participantsConfirmed) {
    return { error: "participants_pending", propagation: null };
  }

  const advancingTeam = advancingTeamForResult(existing, result);
  if (advancingTeam.error) {
    return { error: advancingTeam.error, propagation: null };
  }

  const match = await tx.match.update({
    where: { id: matchId },
    data: {
      ...(result.startsAt ? { startsAt: result.startsAt } : {}),
      status: result.status,
      teamAScore: result.teamAScore,
      teamBScore: result.teamBScore,
      advancingTeam: advancingTeam.value,
    },
  });

  await recalculateMatchPredictions(tx, match);
  const propagation = await propagateFutureParticipants(tx);
  return { error: null, propagation };
}

function advancingTeamForResult(
  match: {
    stage: string;
    teamA: string | null;
    teamB: string | null;
  },
  result: MatchResultUpdate,
): { value: string | null; error: ErrorFeedbackCode | null } {
  if (result.status !== "FINISHED" || match.stage === "GROUP_STAGE") {
    return { value: null, error: null };
  }

  if (!match.teamA || !match.teamB) {
    return { value: null, error: "unresolved_match" };
  }

  if (result.teamAScore === result.teamBScore) {
    if (
      result.advancingTeam !== match.teamA &&
      result.advancingTeam !== match.teamB
    ) {
      return { value: null, error: "knockout_qualifier_required" };
    }
    return { value: result.advancingTeam, error: null };
  }

  return {
    value: result.teamAScore! > result.teamBScore! ? match.teamA : match.teamB,
    error: null,
  };
}
