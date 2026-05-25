import type { MatchStageValue } from "@/lib/constants";

export const STAGE_POINTS: Record<MatchStageValue, number> = {
  GROUP_STAGE: 10,
  ROUND_OF_32: 15,
  ROUND_OF_16: 20,
  QUARTER_FINALS: 30,
  SEMI_FINALS: 50,
  THIRD_PLACE_MATCH: 40,
  FINAL: 100,
};

export type ScoringCategory =
  | "EXACT_SCORE"
  | "CORRECT_WINNER_EXACT_WINNER_SCORE"
  | "CORRECT_WINNER_EXACT_LOSER_SCORE"
  | "CORRECT_WINNER_ONLY"
  | "CORRECT_DRAW_ONLY"
  | "WRONG_PREDICTION";

type Score = {
  teamAScore: number;
  teamBScore: number;
};

type FinishedMatch = Score & {
  stage: MatchStageValue;
};

export type ScoringResult = {
  category: ScoringCategory;
  points: number;
};

type Outcome = "TEAM_A" | "TEAM_B" | "DRAW";

export function scoreOutcome(score: Score): Outcome {
  if (score.teamAScore === score.teamBScore) {
    return "DRAW";
  }

  return score.teamAScore > score.teamBScore ? "TEAM_A" : "TEAM_B";
}

function percentagePoints(stage: MatchStageValue, percentage: number) {
  return Math.round(STAGE_POINTS[stage] * percentage);
}

export function calculatePredictionPoints(
  prediction: Score,
  match: FinishedMatch,
): ScoringResult {
  if (
    prediction.teamAScore === match.teamAScore &&
    prediction.teamBScore === match.teamBScore
  ) {
    return { category: "EXACT_SCORE", points: STAGE_POINTS[match.stage] };
  }

  const predictedOutcome = scoreOutcome(prediction);
  const actualOutcome = scoreOutcome(match);

  if (predictedOutcome !== actualOutcome) {
    return { category: "WRONG_PREDICTION", points: 0 };
  }

  if (actualOutcome === "DRAW") {
    return {
      category: "CORRECT_DRAW_ONLY",
      points: percentagePoints(match.stage, 0.3),
    };
  }

  const winnerScoreMatches =
    actualOutcome === "TEAM_A"
      ? prediction.teamAScore === match.teamAScore
      : prediction.teamBScore === match.teamBScore;
  const loserScoreMatches =
    actualOutcome === "TEAM_A"
      ? prediction.teamBScore === match.teamBScore
      : prediction.teamAScore === match.teamAScore;

  if (winnerScoreMatches) {
    return {
      category: "CORRECT_WINNER_EXACT_WINNER_SCORE",
      points: percentagePoints(match.stage, 0.7),
    };
  }

  if (loserScoreMatches) {
    return {
      category: "CORRECT_WINNER_EXACT_LOSER_SCORE",
      points: percentagePoints(match.stage, 0.5),
    };
  }

  return {
    category: "CORRECT_WINNER_ONLY",
    points: percentagePoints(match.stage, 0.3),
  };
}

export function isCorrectWinner(
  prediction: Score,
  actual: Score,
): boolean {
  const outcome = scoreOutcome(actual);
  return outcome !== "DRAW" && scoreOutcome(prediction) === outcome;
}

export function predictionAchievements(prediction: Score, match: FinishedMatch) {
  return {
    exact: calculatePredictionPoints(prediction, match).category === "EXACT_SCORE",
    correctWinner: isCorrectWinner(prediction, match),
  };
}
