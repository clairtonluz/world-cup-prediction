import type { MatchStageValue } from "@/lib/constants";
import { predictionAchievements } from "@/lib/scoring";

export type RankingPrediction = {
  teamAScore: number;
  teamBScore: number;
  points: number;
  match: {
    stage: string;
    status: string;
    teamAScore: number | null;
    teamBScore: number | null;
  };
};

export type RankingParticipant = {
  id: string;
  name: string;
  image: string | null;
  predictions: RankingPrediction[];
};

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

export function calculateRanking(
  participants: RankingParticipant[],
  currentUserId: string,
) {
  const rows = participants
    .map((participant) => {
      let exactPredictions = 0;
      let correctWinners = 0;

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
        if (achievements.correctWinner) {
          correctWinners += 1;
        }
      }

      return {
        id: participant.id,
        name: participant.name,
        image: participant.image,
        totalPoints: participant.predictions.reduce(
          (total, prediction) => total + prediction.points,
          0,
        ),
        exactPredictions,
        correctWinners,
      };
    })
    .sort(compareRankingRows)
    .map((row, index) => ({
      ...row,
      position: index + 1,
      isCurrentUser: row.id === currentUserId,
    }));

  return {
    rows,
    currentUser: rows.find((row) => row.isCurrentUser) ?? null,
    provisional: participants.some((participant) =>
      participant.predictions.some(
        (prediction) => prediction.match.status === "STARTED",
      ),
    ),
  };
}

function compareRankingRows(
  a: Omit<RankingRow, "position" | "isCurrentUser">,
  b: Omit<RankingRow, "position" | "isCurrentUser">,
) {
  return (
    b.totalPoints - a.totalPoints ||
    b.exactPredictions - a.exactPredictions ||
    b.correctWinners - a.correctWinners ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) ||
    a.id.localeCompare(b.id)
  );
}
