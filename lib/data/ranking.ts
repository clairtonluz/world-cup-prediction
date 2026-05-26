import "server-only";

import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { predictionAchievements } from "@/lib/scoring";
import type { MatchStageValue } from "@/lib/constants";

export type RankingRow = {
  position: number;
  id: string;
  name: string;
  image: string | null;
  totalPoints: number;
  exactPredictions: number;
  correctWinners: number;
  isCurrentUser: boolean;
};

export async function getRanking() {
  const { user: currentUser } = await requireUser();
  const users = await getDb().user.findMany({
    select: {
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
    },
  });

  const unsorted = users.map((user) => {
    let exactPredictions = 0;
    let correctWinners = 0;

    for (const prediction of user.predictions) {
      if (
        prediction.match.teamAScore === null ||
        prediction.match.teamBScore === null
      ) {
        continue;
      }

      const actual = {
        stage: prediction.match.stage as MatchStageValue,
        teamAScore: prediction.match.teamAScore,
        teamBScore: prediction.match.teamBScore,
      };
      const guessed = {
        teamAScore: prediction.teamAScore,
        teamBScore: prediction.teamBScore,
      };
      const achievements = predictionAchievements(guessed, actual);
      if (achievements.exact) {
        exactPredictions += 1;
      }
      if (achievements.correctWinner) {
        correctWinners += 1;
      }
    }

    return {
      id: user.id,
      name: user.name,
      image: user.image,
      totalPoints: user.predictions.reduce(
        (total, prediction) => total + prediction.points,
        0,
      ),
      exactPredictions,
      correctWinners,
    };
  });

  unsorted.sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.exactPredictions - a.exactPredictions ||
      b.correctWinners - a.correctWinners ||
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) ||
      a.id.localeCompare(b.id),
  );

  const rows: RankingRow[] = unsorted.map((row, index) => ({
    ...row,
    position: index + 1,
    isCurrentUser: row.id === currentUser.id,
  }));

  return {
    rows,
    currentUser: rows.find((row) => row.isCurrentUser) ?? null,
    provisional: users.some((user) =>
      user.predictions.some((prediction) => prediction.match.status === "STARTED"),
    ),
  };
}
