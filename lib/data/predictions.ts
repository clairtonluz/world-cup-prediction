import "server-only";

import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";

export async function listPersonalPredictions() {
  const { user } = await requireUser();

  return getDb().prediction.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      teamAScore: true,
      teamBScore: true,
      predictedAdvancingTeam: true,
      points: true,
      match: {
        select: {
          id: true,
          matchNumber: true,
          teamA: true,
          teamB: true,
          teamASlot: true,
          teamBSlot: true,
          participantsConfirmed: true,
          stage: true,
          startsAt: true,
          status: true,
          teamAScore: true,
          teamBScore: true,
        },
      },
    },
    orderBy: [
      { match: { startsAt: "asc" } },
      { match: { matchNumber: "asc" } },
    ],
  });
}

export type PersonalPrediction = Awaited<
  ReturnType<typeof listPersonalPredictions>
>[number];
