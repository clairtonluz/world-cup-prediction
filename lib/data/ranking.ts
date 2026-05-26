import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { calculateRanking } from "@/lib/ranking";

export type { RankingRow } from "@/lib/ranking";

export const rankingParticipantSelect = {
  id: true,
  name: true,
  image: true,
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
      points: true,
      match: {
        select: {
          stage: true,
          status: true,
          teamAScore: true,
          teamBScore: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export async function getRanking() {
  const { user: currentUser } = await requireUser();
  const users = await getDb().user.findMany({
    where: { hiddenFromGlobalRanking: false },
    select: rankingParticipantSelect,
  });

  return calculateRanking(users, currentUser.id);
}
