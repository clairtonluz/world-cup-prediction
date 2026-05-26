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

const SCORING_RATES: Record<ScoringCategory, number> = {
  EXACT_SCORE: 1,
  CORRECT_WINNER_EXACT_WINNER_SCORE: 0.7,
  CORRECT_WINNER_EXACT_LOSER_SCORE: 0.5,
  CORRECT_WINNER_ONLY: 0.3,
  CORRECT_DRAW_ONLY: 0.3,
  WRONG_PREDICTION: 0,
};

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

export function pointsForScoringCategory(
  stage: MatchStageValue,
  category: ScoringCategory,
) {
  return Math.round(STAGE_POINTS[stage] * SCORING_RATES[category]);
}

export function calculatePredictionPoints(
  prediction: Score,
  match: FinishedMatch,
): ScoringResult {
  if (
    prediction.teamAScore === match.teamAScore &&
    prediction.teamBScore === match.teamBScore
  ) {
    return {
      category: "EXACT_SCORE",
      points: pointsForScoringCategory(match.stage, "EXACT_SCORE"),
    };
  }

  const predictedOutcome = scoreOutcome(prediction);
  const actualOutcome = scoreOutcome(match);

  if (predictedOutcome !== actualOutcome) {
    return {
      category: "WRONG_PREDICTION",
      points: pointsForScoringCategory(match.stage, "WRONG_PREDICTION"),
    };
  }

  if (actualOutcome === "DRAW") {
    return {
      category: "CORRECT_DRAW_ONLY",
      points: pointsForScoringCategory(match.stage, "CORRECT_DRAW_ONLY"),
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
      points: pointsForScoringCategory(
        match.stage,
        "CORRECT_WINNER_EXACT_WINNER_SCORE",
      ),
    };
  }

  if (loserScoreMatches) {
    return {
      category: "CORRECT_WINNER_EXACT_LOSER_SCORE",
      points: pointsForScoringCategory(
        match.stage,
        "CORRECT_WINNER_EXACT_LOSER_SCORE",
      ),
    };
  }

  return {
    category: "CORRECT_WINNER_ONLY",
    points: pointsForScoringCategory(match.stage, "CORRECT_WINNER_ONLY"),
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
