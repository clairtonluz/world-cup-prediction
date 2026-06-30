import { describe, expect, it } from "vitest";
import {
  calculatePredictionPoints,
  isCorrectResult,
  pointsForAdvancingTeamBonus,
  pointsForScoringCategory,
  predictionAchievements,
  STAGE_POINTS,
} from "@/lib/scoring";

describe("calculatePredictionPoints", () => {
  it("awards complete stage points for exact scores and exact draws", () => {
    expect(
      calculatePredictionPoints(
        { teamAScore: 2, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 1, stage: "GROUP_STAGE" },
      ),
    ).toEqual(scoringResult("EXACT_SCORE", 10));

    expect(
      calculatePredictionPoints(
        { teamAScore: 2, teamBScore: 2 },
        { teamAScore: 2, teamBScore: 2, stage: "FINAL" },
      ),
    ).toEqual(scoringResult("EXACT_SCORE", 100));
  });

  it("awards the winner score and loser score categories for either winner", () => {
    expect(
      calculatePredictionPoints(
        { teamAScore: 2, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 0, stage: "FINAL" },
      ),
    ).toEqual({
      category: "CORRECT_WINNER_EXACT_WINNER_SCORE",
      points: 70,
      bonusPoints: 0,
    });

    expect(
      calculatePredictionPoints(
        { teamAScore: 1, teamBScore: 3 },
        { teamAScore: 0, teamBScore: 3, stage: "FINAL" },
      ),
    ).toEqual({
      category: "CORRECT_WINNER_EXACT_WINNER_SCORE",
      points: 70,
      bonusPoints: 0,
    });

    expect(
      calculatePredictionPoints(
        { teamAScore: 3, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 1, stage: "FINAL" },
      ),
    ).toEqual({
      category: "CORRECT_WINNER_EXACT_LOSER_SCORE",
      points: 50,
      bonusPoints: 0,
    });
  });

  it("awards correct result and exact goal difference points", () => {
    expect(
      calculatePredictionPoints(
        { teamAScore: 4, teamBScore: 3 },
        { teamAScore: 2, teamBScore: 1, stage: "GROUP_STAGE" },
      ),
    ).toEqual(scoringResult("CORRECT_RESULT_EXACT_GOAL_DIFFERENCE", 4));

    expect(
      calculatePredictionPoints(
        { teamAScore: 2, teamBScore: 4 },
        { teamAScore: 1, teamBScore: 3, stage: "FINAL" },
      ),
    ).toEqual(scoringResult("CORRECT_RESULT_EXACT_GOAL_DIFFERENCE", 40));

    expect(
      calculatePredictionPoints(
        { teamAScore: 1, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 2, stage: "ROUND_OF_32" },
      ),
    ).toEqual(scoringResult("CORRECT_RESULT_EXACT_GOAL_DIFFERENCE", 6));
  });

  it("awards correct outcome points and rounds fractional stage rewards", () => {
    expect(
      calculatePredictionPoints(
        { teamAScore: 3, teamBScore: 0 },
        { teamAScore: 2, teamBScore: 1, stage: "FINAL" },
      ),
    ).toEqual(scoringResult("CORRECT_WINNER_ONLY", 30));
  });

  it("adds a knockout advancing-team bonus for exact scores with the correct advancing team", () => {
    expect(
      calculatePredictionPoints(
        {
          teamAScore: 2,
          teamBScore: 2,
          predictedAdvancingTeam: "Brasil",
        },
        {
          teamAScore: 2,
          teamBScore: 2,
          stage: "ROUND_OF_16",
          advancingTeam: "Brasil",
        },
      ),
    ).toEqual(scoringResult("EXACT_SCORE", 22, 2));

    expect(
      calculatePredictionPoints(
        {
          teamAScore: 2,
          teamBScore: 1,
          predictedAdvancingTeam: "Brasil",
        },
        {
          teamAScore: 2,
          teamBScore: 1,
          stage: "SEMI_FINALS",
          advancingTeam: "Brasil",
        },
      ),
    ).toEqual(scoringResult("EXACT_SCORE", 55, 5));
  });

  it("adds a knockout advancing-team bonus for non-exact draws with the correct advancing team", () => {
    expect(
      calculatePredictionPoints(
        {
          teamAScore: 1,
          teamBScore: 1,
          predictedAdvancingTeam: "Brasil",
        },
        {
          teamAScore: 2,
          teamBScore: 2,
          stage: "ROUND_OF_32",
          advancingTeam: "Brasil",
        },
      ),
    ).toEqual(scoringResult("CORRECT_RESULT_EXACT_GOAL_DIFFERENCE", 8, 2));
  });

  it("adds a knockout advancing-team bonus when only the advancing team is correct", () => {
    expect(
      calculatePredictionPoints(
        {
          teamAScore: 2,
          teamBScore: 1,
          predictedAdvancingTeam: "Brasil",
        },
        {
          teamAScore: 1,
          teamBScore: 1,
          stage: "ROUND_OF_16",
          advancingTeam: "Brasil",
        },
      ),
    ).toEqual(scoringResult("WRONG_PREDICTION", 2, 2));
  });

  it("does not add the advancing-team bonus when the advancing team is wrong", () => {
    expect(
      calculatePredictionPoints(
        {
          teamAScore: 2,
          teamBScore: 2,
          predictedAdvancingTeam: "Franca",
        },
        {
          teamAScore: 2,
          teamBScore: 2,
          stage: "ROUND_OF_16",
          advancingTeam: "Brasil",
        },
      ),
    ).toEqual(scoringResult("EXACT_SCORE", 20));
  });

  it("adds the advancing-team bonus to non-exact knockout wins", () => {
    expect(
      calculatePredictionPoints(
        {
          teamAScore: 3,
          teamBScore: 1,
          predictedAdvancingTeam: "Brasil",
        },
        {
          teamAScore: 2,
          teamBScore: 1,
          stage: "SEMI_FINALS",
          advancingTeam: "Brasil",
        },
      ),
    ).toEqual(scoringResult("CORRECT_WINNER_EXACT_LOSER_SCORE", 30, 5));
  });

  it("awards zero for a wrong outcome", () => {
    expect(
      calculatePredictionPoints(
        { teamAScore: 1, teamBScore: 0 },
        { teamAScore: 1, teamBScore: 2, stage: "ROUND_OF_16" },
      ),
    ).toEqual(scoringResult("WRONG_PREDICTION", 0));
  });

  it("defines every configured stage base value", () => {
    expect(STAGE_POINTS).toEqual({
      GROUP_STAGE: 10,
      ROUND_OF_32: 15,
      ROUND_OF_16: 20,
      QUARTER_FINALS: 30,
      SEMI_FINALS: 50,
      THIRD_PLACE_MATCH: 40,
      FINAL: 100,
    });
  });

  it("calculates the displayed category points using the scoring rounding rule", () => {
    expect(pointsForScoringCategory("ROUND_OF_32", "EXACT_SCORE")).toBe(15);
    expect(
      pointsForScoringCategory(
        "ROUND_OF_32",
        "CORRECT_WINNER_EXACT_WINNER_SCORE",
      ),
    ).toBe(11);
    expect(
      pointsForScoringCategory(
        "ROUND_OF_32",
        "CORRECT_WINNER_EXACT_LOSER_SCORE",
      ),
    ).toBe(8);
    expect(
      pointsForScoringCategory(
        "ROUND_OF_32",
        "CORRECT_RESULT_EXACT_GOAL_DIFFERENCE",
      ),
    ).toBe(6);
    expect(pointsForAdvancingTeamBonus("ROUND_OF_32")).toBe(2);
  });
});

describe("isCorrectResult", () => {
  it("counts correct winning teams and correct draws", () => {
    expect(
      isCorrectResult(
        { teamAScore: 3, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 1 },
      ),
    ).toBe(true);
    expect(
      isCorrectResult(
        { teamAScore: 1, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 2 },
      ),
    ).toBe(true);
  });
});

function scoringResult(category: string, points: number, bonusPoints = 0) {
  return { category, points, bonusPoints };
}

describe("predictionAchievements", () => {
  it("summarizes ranking counters from scoring outcomes", () => {
    expect(
      predictionAchievements(
        { teamAScore: 2, teamBScore: 1 },
        { stage: "GROUP_STAGE", teamAScore: 2, teamBScore: 0 },
      ),
    ).toEqual({ exact: false, correctResult: true });
    expect(
      predictionAchievements(
        { teamAScore: 2, teamBScore: 2 },
        { stage: "GROUP_STAGE", teamAScore: 2, teamBScore: 2 },
      ),
    ).toEqual({ exact: true, correctResult: true });
  });
});
