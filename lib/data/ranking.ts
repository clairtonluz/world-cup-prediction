import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { calculateRanking, type RankingContext } from "@/lib/ranking";
import {
  mayRevealChampionPredictions,
  officialChampionFromFinal,
} from "@/lib/tournament-predictions";

export type { RankingRow } from "@/lib/ranking";

export const rankingParticipantSelect = {
  id: true,
  name: true,
  image: true,
  predictedChampion: true,
  predictions: {
    where: {
      match: {
        OR: [
          { status: "FINISHED" },
          {
            status: "STARTED",
            teamAScore: { not: null },
            teamBScore: { not: null },
          },
        ],
      },
    },
    select: {
      teamAScore: true,
      teamBScore: true,
      predictedAdvancingTeam: true,
      points: true,
      match: {
        select: {
          stage: true,
          status: true,
          teamAScore: true,
          teamBScore: true,
          advancingTeam: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export async function getRanking() {
  const { user: currentUser } = await requireUser();
  const [users, context] = await Promise.all([
    getDb().user.findMany({
      where: { hiddenFromGlobalRanking: false },
      select: rankingParticipantSelect,
    }),
    getRankingContext(),
  ]);

  return calculateRanking(users, currentUser.id, context);
}

export async function getRankingContext(): Promise<RankingContext> {
  const db = getDb();
  const [openingMatch, finalMatch] = await Promise.all([
    db.match.findFirst({
      select: { startsAt: true, status: true },
      orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }],
    }),
    db.match.findFirst({
      where: { stage: "FINAL" },
      select: { status: true, advancingTeam: true },
    }),
  ]);

  return {
    officialChampion: officialChampionFromFinal(finalMatch),
    revealPredictedChampion: mayRevealChampionPredictions(openingMatch),
  };
}
