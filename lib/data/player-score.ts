import "server-only";

import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import type { MatchStageValue } from "@/lib/constants";
import { requireUser } from "@/lib/auth-guards";
import { withCurrentDisplayPoints } from "@/lib/data/display-points";
import { getDb } from "@/lib/db";
import { predictionAchievements } from "@/lib/scoring";
import { isCorrectAdvancingTeamPrediction } from "@/lib/tournament-predictions";
import { userIdSchema } from "@/lib/validation";

const playerScoreMatchWhere = {
  status: { in: ["FINISHED", "STARTED"] },
} satisfies Prisma.MatchWhereInput;

type PlayerPrediction = {
  id: string;
  teamAScore: number;
  teamBScore: number;
  predictedAdvancingTeam: string | null;
  points: number;
};

type PlayerScoreMatch = {
  id: string;
  matchNumber: number;
  teamA: string | null;
  teamB: string | null;
  teamASlot: string | null;
  teamBSlot: string | null;
  participantsConfirmed: boolean;
  stage: string;
  startsAt: Date;
  status: string;
  teamAScore: number | null;
  teamBScore: number | null;
  advancingTeam: string | null;
  predictions: PlayerPrediction[];
};

export async function getPlayerScorePageData(playerId: string) {
  await requireUser();

  const parsedPlayerId = userIdSchema.safeParse(playerId);
  if (!parsedPlayerId.success) {
    notFound();
  }

  const db = getDb();
  const player = await db.user.findUnique({
    where: { id: parsedPlayerId.data },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  if (!player) {
    notFound();
  }

  const matches = await db.match.findMany({
    where: playerScoreMatchWhere,
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
      advancingTeam: true,
      predictions: {
        where: { userId: parsedPlayerId.data },
        select: {
          id: true,
          teamAScore: true,
          teamBScore: true,
          predictedAdvancingTeam: true,
          points: true,
        },
        take: 1,
      },
    },
    orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }],
  });

  const rows = withCumulativePoints(matches.map(playerScoreMatchRow));
  const summary = playerScoreSummary(rows);

  return {
    player,
    summary,
    matches: rows,
  };
}

export type PlayerScorePageData = Awaited<
  ReturnType<typeof getPlayerScorePageData>
>;

function playerScoreMatchRow(match: PlayerScoreMatch) {
  const prediction = match.predictions[0] ?? null;
  const hasOfficialScore =
    match.teamAScore !== null && match.teamBScore !== null;
  const displayPrediction =
    prediction && hasOfficialScore
      ? withCurrentDisplayPoints(prediction, match)
      : prediction;
  const points = hasOfficialScore ? displayPrediction?.points ?? 0 : 0;

  return {
    id: match.id,
    matchNumber: match.matchNumber,
    teamA: match.teamA,
    teamB: match.teamB,
    teamASlot: match.teamASlot,
    teamBSlot: match.teamBSlot,
    participantsConfirmed: match.participantsConfirmed,
    stage: match.stage,
    startsAt: match.startsAt,
    status: match.status,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    advancingTeam: match.advancingTeam,
    prediction: displayPrediction
      ? {
          id: displayPrediction.id,
          teamAScore: displayPrediction.teamAScore,
          teamBScore: displayPrediction.teamBScore,
          predictedAdvancingTeam: displayPrediction.predictedAdvancingTeam,
        }
      : null,
    points,
  };
}

type PlayerScoreMatchRow = ReturnType<typeof playerScoreMatchRow>;

function withCumulativePoints(matches: PlayerScoreMatchRow[]) {
  let cumulativePoints = 0;

  return matches.map((match) => {
    cumulativePoints += match.points;
    return {
      ...match,
      cumulativePoints,
    };
  });
}

function playerScoreSummary(matches: PlayerScoreMatchRow[]) {
  let exactPredictions = 0;
  let correctResults = 0;
  let correctAdvancingTeams = 0;
  let submittedPredictions = 0;
  let totalPoints = 0;
  let provisional = false;

  for (const match of matches) {
    totalPoints += match.points;
    provisional ||= match.status === "STARTED";

    if (!match.prediction) {
      continue;
    }

    submittedPredictions += 1;

    if (match.teamAScore === null || match.teamBScore === null) {
      continue;
    }

    const stage = match.stage as MatchStageValue;
    const achievements = predictionAchievements(
      {
        teamAScore: match.prediction.teamAScore,
        teamBScore: match.prediction.teamBScore,
      },
      {
        stage,
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
      },
    );

    if (achievements.exact) {
      exactPredictions += 1;
    }

    if (achievements.correctResult) {
      correctResults += 1;
    }

    if (
      isCorrectAdvancingTeamPrediction(
        stage,
        match.prediction.predictedAdvancingTeam,
        match.advancingTeam,
      )
    ) {
      correctAdvancingTeams += 1;
    }
  }

  return {
    totalPoints,
    matchesConsidered: matches.length,
    submittedPredictions,
    missingPredictions: matches.length - submittedPredictions,
    exactPredictions,
    correctResults,
    correctAdvancingTeams,
    provisional,
  };
}
