import { describe, expect, it } from "vitest";
import type { EspnScoreboardEvent } from "@/lib/score-sync/client";
import {
  espnDateKeyForMatch,
  footballNamesMatch,
  isEligibleForAutomaticScoreSync,
  mapEspnEventToResult,
  type ScoreSyncableMatch,
} from "@/lib/score-sync/mapping";

describe("score sync eligibility", () => {
  const startsAt = new Date("2026-06-11T19:00:00Z");

  it("only allows automatic updates during the live window", () => {
    expect(isEligibleForAutomaticScoreSync(match({ startsAt }), new Date("2026-06-11T18:59:59Z"))).toBe(false);
    expect(isEligibleForAutomaticScoreSync(match({ startsAt }), startsAt)).toBe(true);
    expect(isEligibleForAutomaticScoreSync(match({ startsAt }), new Date("2026-06-11T21:59:59Z"))).toBe(true);
    expect(isEligibleForAutomaticScoreSync(match({ startsAt }), new Date("2026-06-11T22:00:00Z"))).toBe(false);
  });

  it("skips finished, locked, and unmapped matches", () => {
    expect(isEligibleForAutomaticScoreSync(match({ status: "FINISHED" }), startsAt)).toBe(false);
    expect(isEligibleForAutomaticScoreSync(match({ scoreSyncLocked: true }), startsAt)).toBe(false);
    expect(isEligibleForAutomaticScoreSync(match({ espnEventId: null }), startsAt)).toBe(false);
  });
});

describe("ESPN event mapping", () => {
  it("does not map pre-match events", () => {
    expect(mapEspnEventToResult(event({ state: "pre" }), match())).toEqual({
      kind: "skipped",
      reason: "not_started",
    });
  });

  it("maps in-progress scores to the app result shape", () => {
    expect(
      mapEspnEventToResult(
        event({ state: "in", homeScore: "2", awayScore: "1" }),
        match(),
      ),
    ).toEqual({
      kind: "mapped",
      result: {
        status: "STARTED",
        teamAScore: 2,
        teamBScore: 1,
        advancingTeam: null,
      },
    });
  });

  it("uses ESPN winner data for tied knockout matches", () => {
    expect(
      mapEspnEventToResult(
        event({
          state: "post",
          completed: true,
          homeScore: "1",
          awayScore: "1",
          homeWinner: true,
        }),
        match({ stage: "ROUND_OF_16" }),
      ),
    ).toEqual({
      kind: "mapped",
      result: {
        status: "FINISHED",
        teamAScore: 1,
        teamBScore: 1,
        advancingTeam: "Brasil",
      },
    });
  });

  it("matches key Portuguese team names to ESPN English names", () => {
    expect(footballNamesMatch("México", "Mexico")).toBe(true);
    expect(footballNamesMatch("África do Sul", "South Africa")).toBe(true);
    expect(footballNamesMatch("Alemanha", "Germany")).toBe(true);
    expect(footballNamesMatch("Alemanha", "GER")).toBe(true);
    expect(footballNamesMatch("Escócia", "Scotland")).toBe(true);
    expect(footballNamesMatch("Curaçau", "Curacao")).toBe(true);
    expect(footballNamesMatch("Suécia", "Sweden")).toBe(true);
    expect(footballNamesMatch("Turquia", "Türkiye")).toBe(true);
    expect(footballNamesMatch("EUA", "United States")).toBe(true);
    expect(footballNamesMatch("Noruega", "Norway")).toBe(true);
    expect(footballNamesMatch("Iraque", "Iraq")).toBe(true);
    expect(footballNamesMatch("Cabo Verde", "Cape Verde")).toBe(true);
    expect(footballNamesMatch("República da Coreia", "South Korea")).toBe(true);
    expect(footballNamesMatch("Tchéquia", "Czechia")).toBe(true);
  });

  it("uses New York date keys to match ESPN scoreboard grouping", () => {
    expect(espnDateKeyForMatch(new Date("2026-06-12T02:00:00Z"))).toBe("20260611");
  });
});

function match(overrides: Partial<ScoreSyncableMatch> = {}): ScoreSyncableMatch {
  return {
    id: "match",
    matchNumber: 1,
    espnEventId: "760415",
    scoreSyncLocked: false,
    startsAt: new Date("2026-06-11T19:00:00Z"),
    status: "SCHEDULED",
    stage: "GROUP_STAGE",
    teamA: "Brasil",
    teamB: "Argentina",
    ...overrides,
  };
}

function event({
  state,
  completed = false,
  homeScore = "0",
  awayScore = "0",
  homeWinner = false,
  awayWinner = false,
}: {
  state: string;
  completed?: boolean;
  homeScore?: string;
  awayScore?: string;
  homeWinner?: boolean;
  awayWinner?: boolean;
}): EspnScoreboardEvent {
  return {
    id: "760415",
    date: "2026-06-11T19:00Z",
    status: {
      type: { state, completed },
    },
    competitions: [
      {
        competitors: [
          {
            homeAway: "home",
            score: homeScore,
            winner: homeWinner,
            team: { displayName: "Brasil" },
          },
          {
            homeAway: "away",
            score: awayScore,
            winner: awayWinner,
            team: { displayName: "Argentina" },
          },
        ],
      },
    ],
  };
}
