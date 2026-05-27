import type { MatchStageValue } from "@/lib/constants";
import { isCorrectAdvancingTeamPrediction } from "@/lib/tournament-predictions";

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

const DRAW_ADVANCING_TEAM_BONUS_RATE = 0.1;

type Score = {
  teamAScore: number;
  teamBScore: number;
};

type PredictionScore = Score & {
  predictedAdvancingTeam?: string | null;
};

type FinishedMatch = Score & {
  stage: MatchStageValue;
  advancingTeam?: string | null;
};

export type ScoringResult = {
  category: ScoringCategory;
  points: number;
  bonusPoints: number;
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

export function pointsForDrawAdvancingTeamBonus(stage: MatchStageValue) {
  return Math.round(STAGE_POINTS[stage] * DRAW_ADVANCING_TEAM_BONUS_RATE);
}

export function calculatePredictionPoints(
  prediction: PredictionScore,
  match: FinishedMatch,
): ScoringResult {
  const predictedOutcome = scoreOutcome(prediction);
  const actualOutcome = scoreOutcome(match);
  const bonusPoints = drawAdvancingTeamBonusPoints(
    prediction,
    match,
    predictedOutcome,
    actualOutcome,
  );

  if (
    prediction.teamAScore === match.teamAScore &&
    prediction.teamBScore === match.teamBScore
  ) {
    return scoringResult(match.stage, "EXACT_SCORE", bonusPoints);
  }

  if (predictedOutcome !== actualOutcome) {
    return scoringResult(match.stage, "WRONG_PREDICTION", bonusPoints);
  }

  if (actualOutcome === "DRAW") {
    return scoringResult(match.stage, "CORRECT_DRAW_ONLY", bonusPoints);
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
    return scoringResult(
      match.stage,
      "CORRECT_WINNER_EXACT_WINNER_SCORE",
      bonusPoints,
    );
  }

  if (loserScoreMatches) {
    return scoringResult(
      match.stage,
      "CORRECT_WINNER_EXACT_LOSER_SCORE",
      bonusPoints,
    );
  }

  return scoringResult(match.stage, "CORRECT_WINNER_ONLY", bonusPoints);
}

export function isCorrectResult(
  prediction: Score,
  actual: Score,
): boolean {
  return scoreOutcome(prediction) === scoreOutcome(actual);
}

export function predictionAchievements(prediction: Score, match: FinishedMatch) {
  return {
    exact: calculatePredictionPoints(prediction, match).category === "EXACT_SCORE",
    correctResult: isCorrectResult(prediction, match),
  };
}

function scoringResult(
  stage: MatchStageValue,
  category: ScoringCategory,
  bonusPoints: number,
): ScoringResult {
  return {
    category,
    points: pointsForScoringCategory(stage, category) + bonusPoints,
    bonusPoints,
  };
}

function drawAdvancingTeamBonusPoints(
  prediction: PredictionScore,
  match: FinishedMatch,
  predictedOutcome: Outcome,
  actualOutcome: Outcome,
) {
  if (predictedOutcome !== "DRAW" || actualOutcome !== "DRAW") {
    return 0;
  }

  return isCorrectAdvancingTeamPrediction(
    match.stage,
    prediction.predictedAdvancingTeam ?? null,
    match.advancingTeam ?? null,
  )
    ? pointsForDrawAdvancingTeamBonus(match.stage)
    : 0;
}
