import { describe, expect, it } from "vitest";
import {
  advancingTeamPredictionForMatch,
  championBonusPoints,
  mayEditChampionPrediction,
  mayRevealChampionPredictions,
  officialChampionFromFinal,
  requiresAdvancingTeamPrediction,
} from "@/lib/tournament-predictions";

const openingMatch = {
  startsAt: new Date("2026-06-11T19:00:00Z"),
  status: "SCHEDULED" as const,
};

describe("champion prediction timing and scoring", () => {
  it("allows edits only before the first effective kickoff", () => {
    expect(mayEditChampionPrediction(openingMatch, new Date("2026-06-11T18:59:59Z"))).toBe(true);
    expect(mayEditChampionPrediction(openingMatch, openingMatch.startsAt)).toBe(false);
    expect(
      mayEditChampionPrediction(
        { ...openingMatch, status: "STARTED" },
        new Date("2026-06-11T18:00:00Z"),
      ),
    ).toBe(false);
  });

  it("reveals predictions after closing and awards points only for the official final winner", () => {
    expect(mayRevealChampionPredictions(openingMatch, openingMatch.startsAt)).toBe(true);
    expect(officialChampionFromFinal({ status: "STARTED", advancingTeam: "Brasil" })).toBeNull();
    expect(officialChampionFromFinal({ status: "FINISHED", advancingTeam: "Brasil" })).toBe("Brasil");
    expect(championBonusPoints("Brasil", "Brasil")).toBe(200);
    expect(championBonusPoints("Argentina", "Brasil")).toBe(0);
  });
});

describe("knockout advancing team predictions", () => {
  const match = { stage: "ROUND_OF_32", teamA: "Brasil", teamB: "Franca" };

  it("requires a classifier only in rounds that feed a later knockout match", () => {
    expect(requiresAdvancingTeamPrediction("ROUND_OF_32")).toBe(true);
    expect(requiresAdvancingTeamPrediction("SEMI_FINALS")).toBe(true);
    expect(requiresAdvancingTeamPrediction("FINAL")).toBe(false);
    expect(requiresAdvancingTeamPrediction("THIRD_PLACE_MATCH")).toBe(false);
  });

  it("accepts a tie-break classifier and rejects invalid tie selections", () => {
    expect(
      advancingTeamPredictionForMatch(match, {
        teamAScore: 1,
        teamBScore: 1,
        predictedAdvancingTeam: "Brasil",
      }),
    ).toEqual({ valid: true, value: "Brasil" });
    expect(
      advancingTeamPredictionForMatch(match, {
        teamAScore: 1,
        teamBScore: 1,
        predictedAdvancingTeam: "Argentina",
      }).valid,
    ).toBe(false);
    expect(
      advancingTeamPredictionForMatch(match, {
        teamAScore: 1,
        teamBScore: 1,
        predictedAdvancingTeam: null,
      }).valid,
    ).toBe(false);
  });

  it("infers the advancing team from non-draw scores", () => {
    expect(
      advancingTeamPredictionForMatch(match, {
        teamAScore: 2,
        teamBScore: 0,
        predictedAdvancingTeam: null,
      }),
    ).toEqual({ valid: true, value: "Brasil" });
  });

  it("ignores incompatible classifier input when the score has a winner", () => {
    expect(
      advancingTeamPredictionForMatch(match, {
        teamAScore: 0,
        teamBScore: 2,
        predictedAdvancingTeam: "Brasil",
      }),
    ).toEqual({ valid: true, value: "Franca" });
  });

  it("discards classifier input for the final instead of scoring it", () => {
    expect(
      advancingTeamPredictionForMatch(
        { ...match, stage: "FINAL" },
        {
          teamAScore: 1,
          teamBScore: 0,
          predictedAdvancingTeam: "Brasil",
        },
      ),
    ).toEqual({ valid: true, value: null });
  });
});
