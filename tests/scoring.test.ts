import { describe, expect, it } from "vitest";
import {
  calculatePredictionPoints,
  isCorrectWinner,
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
    ).toEqual({ category: "EXACT_SCORE", points: 10 });

    expect(
      calculatePredictionPoints(
        { teamAScore: 2, teamBScore: 2 },
        { teamAScore: 2, teamBScore: 2, stage: "FINAL" },
      ),
    ).toEqual({ category: "EXACT_SCORE", points: 100 });
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
    });

    expect(
      calculatePredictionPoints(
        { teamAScore: 1, teamBScore: 3 },
        { teamAScore: 0, teamBScore: 3, stage: "FINAL" },
      ),
    ).toEqual({
      category: "CORRECT_WINNER_EXACT_WINNER_SCORE",
      points: 70,
    });

    expect(
      calculatePredictionPoints(
        { teamAScore: 3, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 1, stage: "FINAL" },
      ),
    ).toEqual({
      category: "CORRECT_WINNER_EXACT_LOSER_SCORE",
      points: 50,
    });
  });

  it("awards correct outcome points and rounds fractional stage rewards", () => {
    expect(
      calculatePredictionPoints(
        { teamAScore: 3, teamBScore: 0 },
        { teamAScore: 2, teamBScore: 1, stage: "FINAL" },
      ),
    ).toEqual({ category: "CORRECT_WINNER_ONLY", points: 30 });

    expect(
      calculatePredictionPoints(
        { teamAScore: 1, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 2, stage: "ROUND_OF_32" },
      ),
    ).toEqual({ category: "CORRECT_DRAW_ONLY", points: 5 });
  });

  it("awards zero for a wrong outcome", () => {
    expect(
      calculatePredictionPoints(
        { teamAScore: 1, teamBScore: 0 },
        { teamAScore: 1, teamBScore: 2, stage: "ROUND_OF_16" },
      ),
    ).toEqual({ category: "WRONG_PREDICTION", points: 0 });
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
});

describe("isCorrectWinner", () => {
  it("counts only correct winning teams, not draws", () => {
    expect(
      isCorrectWinner(
        { teamAScore: 3, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 1 },
      ),
    ).toBe(true);
    expect(
      isCorrectWinner(
        { teamAScore: 1, teamBScore: 1 },
        { teamAScore: 2, teamBScore: 2 },
      ),
    ).toBe(false);
  });
});

describe("predictionAchievements", () => {
  it("summarizes ranking counters from scoring outcomes", () => {
    expect(
      predictionAchievements(
        { teamAScore: 2, teamBScore: 1 },
        { stage: "GROUP_STAGE", teamAScore: 2, teamBScore: 0 },
      ),
    ).toEqual({ exact: false, correctWinner: true });
    expect(
      predictionAchievements(
        { teamAScore: 2, teamBScore: 2 },
        { stage: "GROUP_STAGE", teamAScore: 2, teamBScore: 2 },
      ),
    ).toEqual({ exact: true, correctWinner: false });
  });
});
