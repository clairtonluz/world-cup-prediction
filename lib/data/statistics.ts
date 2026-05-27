import "server-only";

import { STAGE_LABELS, type MatchStageValue } from "@/lib/constants";
import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { predictionAchievements, STAGE_POINTS } from "@/lib/scoring";
import {
  championBonusPoints,
  isCorrectAdvancingTeamPrediction,
  officialChampionFromFinal,
} from "@/lib/tournament-predictions";

const stageOrder: MatchStageValue[] = [
  "GROUP_STAGE",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE_MATCH",
  "FINAL",
];

export async function getPersonalStatistics() {
  const { user } = await requireUser();
  const db = getDb();
  const [participant, finalMatch] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        favoriteTeam: true,
        predictedChampion: true,
        predictions: {
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
      },
    }),
    db.match.findFirst({
      where: { stage: "FINAL" },
      select: { status: true, advancingTeam: true },
    }),
  ]);

  const scored = participant.predictions.filter(
    (prediction) =>
      prediction.match.status !== "SCHEDULED" &&
      prediction.match.teamAScore !== null &&
      prediction.match.teamBScore !== null,
  );

  let exactPredictions = 0;
  let correctResults = 0;
  let correctAdvancingTeams = 0;
  const stages = new Map<MatchStageValue, { points: number; available: number }>();

  for (const prediction of scored) {
    const stage = prediction.match.stage as MatchStageValue;
    const actual = {
      stage,
      teamAScore: prediction.match.teamAScore!,
      teamBScore: prediction.match.teamBScore!,
    };
    const guessed = {
      teamAScore: prediction.teamAScore,
      teamBScore: prediction.teamBScore,
    };

    const achievements = predictionAchievements(guessed, actual);
    if (achievements.exact) {
      exactPredictions += 1;
    }
    if (achievements.correctResult) {
      correctResults += 1;
    }
    if (
      isCorrectAdvancingTeamPrediction(
        stage,
        prediction.predictedAdvancingTeam,
        prediction.match.advancingTeam,
      )
    ) {
      correctAdvancingTeams += 1;
    }

    const current = stages.get(stage) ?? { points: 0, available: 0 };
    stages.set(stage, {
      points: current.points + prediction.points,
      available: current.available + STAGE_POINTS[stage],
    });
  }

  const bestStage = [...stages.entries()].sort(
    ([stageA, a], [stageB, b]) =>
      b.points - a.points ||
      b.points / b.available - a.points / a.available ||
      stageOrder.indexOf(stageA) - stageOrder.indexOf(stageB),
  )[0];

  const championPoints = championBonusPoints(
    participant.predictedChampion,
    officialChampionFromFinal(finalMatch),
  );

  return {
    totalPoints: scored.reduce((total, prediction) => total + prediction.points, championPoints),
    exactPredictions,
    correctResults,
    correctAdvancingTeams,
    championBonusPoints: championPoints,
    championPredictionCorrect: championPoints > 0,
    totalPredictions: participant.predictions.length,
    scoredPredictions: scored.length,
    accuracy:
      scored.length === 0
        ? 0
        : Math.round(
            (scored.filter((prediction) => prediction.points > 0).length /
              scored.length) *
              100,
          ),
    favoriteTeam: participant.favoriteTeam,
    predictedChampion: participant.predictedChampion,
    bestStage: bestStage
      ? {
          label: STAGE_LABELS[bestStage[0]],
          points: bestStage[1].points,
        }
      : null,
    provisional: scored.some((prediction) => prediction.match.status === "STARTED"),
  };
}
