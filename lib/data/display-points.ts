import type { MatchStageValue } from "@/lib/constants";
import { calculatePredictionPoints } from "@/lib/scoring";

type PredictionWithPoints = {
  teamAScore: number;
  teamBScore: number;
  predictedAdvancingTeam: string | null;
  points: number;
};

type MatchWithResult = {
  stage: string;
  teamAScore: number | null;
  teamBScore: number | null;
  advancingTeam: string | null;
};

export function withCurrentDisplayPoints<T extends PredictionWithPoints>(
  prediction: T,
  match: MatchWithResult,
): T {
  if (match.teamAScore === null || match.teamBScore === null) {
    return prediction;
  }

  const result = calculatePredictionPoints(prediction, {
    stage: match.stage as MatchStageValue,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    advancingTeam: match.advancingTeam,
  });

  return { ...prediction, points: result.points };
}

export function withCurrentDisplayPredictionPoints<
  TPrediction extends PredictionWithPoints,
  TMatch extends MatchWithResult & { predictions: TPrediction[] },
>(match: TMatch): TMatch {
  return {
    ...match,
    predictions: match.predictions.map((prediction) =>
      withCurrentDisplayPoints(prediction, match),
    ),
  };
}
