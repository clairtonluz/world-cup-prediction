import { describe, expect, it } from "vitest";
import { hasEffectivelyStarted, mayEditPrediction } from "@/lib/match-rules";
import {
  championPredictionSchema,
  favoriteTeamSchema,
  inviteTokenSchema,
  friendGroupSchema,
  matchIdSchema,
  matchResultSchema,
  predictionSchema,
} from "@/lib/validation";

const matchId = "cmatch000000000000000000001";

describe("matchIdSchema", () => {
  it("accepts fixture ids and rejects non-identifiers", () => {
    expect(matchIdSchema.parse(matchId)).toBe(matchId);
    expect(() => matchIdSchema.parse("../admin?success=match_updated")).toThrow();
  });
});

describe("predictionSchema", () => {
  it("accepts valid score inputs from a form", () => {
    expect(
      predictionSchema.parse({
        matchId,
        teamAScore: "2",
        teamBScore: "1",
      }),
    ).toEqual({
      matchId,
      teamAScore: 2,
      teamBScore: 1,
      predictedAdvancingTeam: null,
    });
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

describe("matchResultSchema", () => {
  it("accepts a scheduled fixture without scores", () => {
    expect(
      matchResultSchema.parse({
        status: "SCHEDULED",
        teamAScore: null,
        teamBScore: null,
        advancingTeam: null,
      }).status,
    ).toBe("SCHEDULED");
  });

  it("accepts paired partial live scores", () => {
    expect(
      matchResultSchema.parse({
        status: "STARTED",
        teamAScore: "1",
        teamBScore: "0",
        advancingTeam: null,
      }),
    ).toMatchObject({ status: "STARTED", teamAScore: 1, teamBScore: 0 });
  });

  it("rejects an incomplete partial live score", () => {
    expect(() =>
      matchResultSchema.parse({
        status: "STARTED",
        teamAScore: "1",
        teamBScore: null,
        advancingTeam: null,
      }),
    ).toThrow();
  });

  it("requires a result when a match is finished", () => {
    expect(() =>
      matchResultSchema.parse({
        status: "FINISHED",
        teamAScore: null,
        teamBScore: null,
        advancingTeam: null,
      }),
    ).toThrow();
  });
});

describe("favoriteTeamSchema", () => {
  it("turns a cleared team value into null", () => {
    expect(favoriteTeamSchema.parse({ favoriteTeam: " " })).toEqual({
      favoriteTeam: null,
    });
  });
});

describe("championPredictionSchema", () => {
  it("normalizes an optional champion selection", () => {
    expect(championPredictionSchema.parse({ predictedChampion: " Brasil " })).toEqual({
      predictedChampion: "Brasil",
    });
    expect(championPredictionSchema.parse({ predictedChampion: "" })).toEqual({
      predictedChampion: null,
    });
  });
});

describe("friend group schemas", () => {
  it("normalizes a readable friend group name", () => {
    expect(friendGroupSchema.parse({ name: "  Amigos da Copa  " })).toEqual({
      name: "Amigos da Copa",
    });
  });

  it("rejects invalid invite tokens and overlong names", () => {
    expect(() => inviteTokenSchema.parse("../admin")).toThrow();
    expect(() => friendGroupSchema.parse({ name: "a".repeat(81) })).toThrow();
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

  it("does not allow predictions while future participants are projected", () => {
    expect(
      mayEditPrediction({
        startsAt: new Date("2026-06-15T19:00:00Z"),
        status: "SCHEDULED",
        participantsConfirmed: false,
      }),
    ).toBe(false);
  });
});
