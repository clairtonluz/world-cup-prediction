import type { MatchStageValue } from "@/lib/constants";
import { predictionAchievements } from "@/lib/scoring";
import {
  championBonusPoints,
  isCorrectAdvancingTeamPrediction,
} from "@/lib/tournament-predictions";

export type RankingPrediction = {
  teamAScore: number;
  teamBScore: number;
  predictedAdvancingTeam: string | null;
  points: number;
  match: {
    stage: string;
    status: string;
    teamAScore: number | null;
    teamBScore: number | null;
    advancingTeam: string | null;
  };
};

export type RankingParticipant = {
  id: string;
  name: string;
  image: string | null;
  predictedChampion: string | null;
  predictions: RankingPrediction[];
};

export type RankingRow = {
  position: number;
  id: string;
  name: string;
  image: string | null;
  totalPoints: number;
  exactPredictions: number;
  correctResults: number;
  correctAdvancingTeams: number;
  championBonusPoints: number;
  predictedChampion: string | null;
  championPredictionCorrect: boolean;
  isCurrentUser: boolean;
};

export type RankingContext = {
  officialChampion: string | null;
  revealPredictedChampion: boolean;
};

const DEFAULT_CONTEXT: RankingContext = {
  officialChampion: null,
  revealPredictedChampion: false,
};

export function calculateRanking(
  participants: RankingParticipant[],
  currentUserId: string,
  context: RankingContext = DEFAULT_CONTEXT,
) {
  const sortedRows = participants
    .map((participant) => {
      let exactPredictions = 0;
      let correctResults = 0;
      let correctAdvancingTeams = 0;

      for (const prediction of participant.predictions) {
        if (
          prediction.match.teamAScore === null ||
          prediction.match.teamBScore === null
        ) {
          continue;
        }

        const achievements = predictionAchievements(
          {
            teamAScore: prediction.teamAScore,
            teamBScore: prediction.teamBScore,
          },
          {
            stage: prediction.match.stage as MatchStageValue,
            teamAScore: prediction.match.teamAScore,
            teamBScore: prediction.match.teamBScore,
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
            prediction.match.stage,
            prediction.predictedAdvancingTeam,
            prediction.match.advancingTeam,
          )
        ) {
          correctAdvancingTeams += 1;
        }
      }

      const championPoints = championBonusPoints(
        participant.predictedChampion,
        context.officialChampion,
      );

      return {
        id: participant.id,
        name: participant.name,
        image: participant.image,
        totalPoints: participant.predictions.reduce(
          (total, prediction) => total + prediction.points,
          championPoints,
        ),
        exactPredictions,
        correctResults,
        correctAdvancingTeams,
        championBonusPoints: championPoints,
        predictedChampion: context.revealPredictedChampion
          ? participant.predictedChampion
          : null,
        championPredictionCorrect: championPoints > 0,
      };
    })
    .sort(compareRankingRows);

  let currentPosition = 0;
  let previousRow: UnpositionedRankingRow | undefined;
  const rows = sortedRows.map((row, index) => {
    if (!previousRow || compareCompetitiveRows(previousRow, row) !== 0) {
      currentPosition = index + 1;
    }
    previousRow = row;

    return {
      ...row,
      position: currentPosition,
      isCurrentUser: row.id === currentUserId,
    };
  });

  return {
    rows,
    currentUser: rows.find((row) => row.isCurrentUser) ?? null,
    championPredictionsVisible: context.revealPredictedChampion,
    provisional: participants.some((participant) =>
      participant.predictions.some(
        (prediction) => prediction.match.status === "STARTED",
      ),
    ),
  };
}

type UnpositionedRankingRow = Omit<RankingRow, "position" | "isCurrentUser">;

function compareRankingRows(
  a: UnpositionedRankingRow,
  b: UnpositionedRankingRow,
) {
  return (
    compareCompetitiveRows(a, b) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) ||
    a.id.localeCompare(b.id)
  );
}

function compareCompetitiveRows(
  a: UnpositionedRankingRow,
  b: UnpositionedRankingRow,
) {
  return (
    b.totalPoints - a.totalPoints ||
    b.exactPredictions - a.exactPredictions ||
    b.correctResults - a.correctResults ||
    b.correctAdvancingTeams - a.correctAdvancingTeams ||
    Number(b.championPredictionCorrect) - Number(a.championPredictionCorrect)
  );
}
