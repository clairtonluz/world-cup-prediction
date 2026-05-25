import { describe, expect, it } from "vitest";
import { hasEffectivelyStarted, mayEditPrediction } from "@/lib/match-rules";
import {
  favoriteTeamSchema,
  matchInputSchema,
  predictionSchema,
} from "@/lib/validation";

const matchId = "cmatch000000000000000000001";

describe("predictionSchema", () => {
  it("accepts valid score inputs from a form", () => {
    expect(
      predictionSchema.parse({
        matchId,
        teamAScore: "2",
        teamBScore: "1",
      }),
    ).toEqual({ matchId, teamAScore: 2, teamBScore: 1 });
  });

  it.each(["", "-1", "1.5", "100", "score"])(
    "rejects invalid score value %s",
    (value) => {
      expect(() =>
        predictionSchema.parse({
          matchId,
          teamAScore: value,
          teamBScore: "0",
        }),
      ).toThrow();
    },
  );
});

describe("matchInputSchema", () => {
  const core = {
    teamA: "Brazil",
    teamB: "Belgium",
    stage: "GROUP_STAGE",
    startsAt: "2026-06-15T19:00:00Z",
  };

  it("accepts a scheduled fixture without result scores", () => {
    expect(
      matchInputSchema.parse({
        ...core,
        status: "SCHEDULED",
        teamAScore: null,
        teamBScore: null,
      }).status,
    ).toBe("SCHEDULED");
  });

  it("requires a result when a match is finished", () => {
    expect(() =>
      matchInputSchema.parse({
        ...core,
        status: "FINISHED",
        teamAScore: null,
        teamBScore: null,
      }),
    ).toThrow();
  });

  it("rejects a match between identical teams", () => {
    expect(() =>
      matchInputSchema.parse({
        ...core,
        teamB: " brazil ",
        status: "SCHEDULED",
        teamAScore: null,
        teamBScore: null,
      }),
    ).toThrow("Teams must be different");
  });
});

describe("favoriteTeamSchema", () => {
  it("turns a cleared team value into null", () => {
    expect(favoriteTeamSchema.parse({ favoriteTeam: " " })).toEqual({
      favoriteTeam: null,
    });
  });
});

describe("match timing", () => {
  it("closes prediction editing at kickoff even before status is updated", () => {
    const match = {
      startsAt: new Date("2026-06-15T19:00:00Z"),
      status: "SCHEDULED" as const,
    };
    const kickoff = new Date("2026-06-15T19:00:00Z");

    expect(hasEffectivelyStarted(match, kickoff)).toBe(true);
    expect(mayEditPrediction(match, kickoff)).toBe(false);
  });

  it("closes prediction editing after admin starts a match early", () => {
    const match = {
      startsAt: new Date("2026-06-15T19:00:00Z"),
      status: "STARTED" as const,
    };

    expect(mayEditPrediction(match, new Date("2026-06-15T18:00:00Z"))).toBe(
      false,
    );
  });
});
