import { describe, expect, it } from "vitest";
import {
  buildKnockoutBracket,
  type KnockoutBracketMatchInput,
} from "@/lib/knockout-bracket";

describe("buildKnockoutBracket", () => {
  it("removes group-stage matches from the bracket view", () => {
    const bracket = buildKnockoutBracket([
      groupMatch({ matchNumber: 1, teamA: "Brasil", teamB: "Marrocos" }),
      knockoutMatch({ matchNumber: 73, stage: "ROUND_OF_32" }),
    ]);

    expect(bracket.stages.flatMap((stage) => stage.matches)).toHaveLength(1);
    expect(bracket.stages[0].matches[0].matchNumber).toBe(73);
  });

  it("orders matches by bracket path instead of only by match date", () => {
    const bracket = buildKnockoutBracket([
      knockoutMatch({ matchNumber: 89, stage: "ROUND_OF_16", teamASlot: "W73", teamBSlot: "W75", startsAt: date(8) }),
      knockoutMatch({ matchNumber: 90, stage: "ROUND_OF_16", teamASlot: "W74", teamBSlot: "W77", startsAt: date(7) }),
      knockoutMatch({ matchNumber: 91, stage: "ROUND_OF_16", teamASlot: "W76", teamBSlot: "W78", startsAt: date(6) }),
      knockoutMatch({ matchNumber: 92, stage: "ROUND_OF_16", teamASlot: "W79", teamBSlot: "W80", startsAt: date(5) }),
      knockoutMatch({ matchNumber: 93, stage: "ROUND_OF_16", teamASlot: "W83", teamBSlot: "W84", startsAt: date(4) }),
      knockoutMatch({ matchNumber: 94, stage: "ROUND_OF_16", teamASlot: "W81", teamBSlot: "W82", startsAt: date(3) }),
      knockoutMatch({ matchNumber: 95, stage: "ROUND_OF_16", teamASlot: "W86", teamBSlot: "W88", startsAt: date(2) }),
      knockoutMatch({ matchNumber: 96, stage: "ROUND_OF_16", teamASlot: "W85", teamBSlot: "W87", startsAt: date(1) }),
      knockoutMatch({ matchNumber: 97, stage: "QUARTER_FINALS", teamASlot: "W89", teamBSlot: "W90" }),
      knockoutMatch({ matchNumber: 98, stage: "QUARTER_FINALS", teamASlot: "W93", teamBSlot: "W94" }),
      knockoutMatch({ matchNumber: 99, stage: "QUARTER_FINALS", teamASlot: "W91", teamBSlot: "W92" }),
      knockoutMatch({ matchNumber: 100, stage: "QUARTER_FINALS", teamASlot: "W95", teamBSlot: "W96" }),
      knockoutMatch({ matchNumber: 101, stage: "SEMI_FINALS", teamASlot: "W97", teamBSlot: "W98" }),
      knockoutMatch({ matchNumber: 102, stage: "SEMI_FINALS", teamASlot: "W99", teamBSlot: "W100" }),
      knockoutMatch({ matchNumber: 104, stage: "FINAL", teamASlot: "W101", teamBSlot: "W102" }),
    ]);

    const roundOf16 = bracket.stages.find((stage) => stage.stage === "ROUND_OF_16");

    expect(roundOf16?.matches.map((match) => match.matchNumber)).toEqual([
      89,
      90,
      93,
      94,
      91,
      92,
      95,
      96,
    ]);
  });

  it("keeps the final and third-place match in separate stages", () => {
    const bracket = buildKnockoutBracket([
      knockoutMatch({ matchNumber: 103, stage: "THIRD_PLACE_MATCH", teamASlot: "RU101", teamBSlot: "RU102" }),
      knockoutMatch({ matchNumber: 104, stage: "FINAL", teamASlot: "W101", teamBSlot: "W102" }),
    ]);

    expect(stageMatchNumbers(bracket, "FINAL")).toEqual([104]);
    expect(stageMatchNumbers(bracket, "THIRD_PLACE_MATCH")).toEqual([103]);
  });

  it("applies projected participants without treating them as confirmed", () => {
    const bracket = buildKnockoutBracket([
      groupMatch({ matchNumber: 1, teamA: "Brasil", teamB: "Escócia", status: "FINISHED", teamAScore: 2, teamBScore: 0 }),
      groupMatch({ matchNumber: 2, teamA: "Marrocos", teamB: "Haiti", status: "SCHEDULED" }),
      groupMatch({ matchNumber: 3, teamA: "Argentina", teamB: "Canadá", groupCode: "B", status: "FINISHED", teamAScore: 3, teamBScore: 0 }),
      groupMatch({ matchNumber: 4, teamA: "Japão", teamB: "Tunísia", groupCode: "B", status: "SCHEDULED" }),
      knockoutMatch({ matchNumber: 73, stage: "ROUND_OF_32", teamASlot: "1A", teamBSlot: "1B" }),
    ]);

    const match = bracket.stages[0].matches[0];

    expect(match.projected).toBe(true);
    expect(match.participantsConfirmed).toBe(false);
    expect(match.teamA).toMatchObject({ team: "Brasil", slot: "1A", projected: true });
    expect(match.teamB).toMatchObject({ team: "Argentina", slot: "1B", projected: true });
  });

  it("does not overwrite confirmed participants with projections", () => {
    const bracket = buildKnockoutBracket([
      groupMatch({ matchNumber: 1, teamA: "Brasil", teamB: "Escócia", status: "FINISHED", teamAScore: 0, teamBScore: 2 }),
      knockoutMatch({
        matchNumber: 73,
        stage: "ROUND_OF_32",
        teamA: "Brasil",
        teamB: "Argentina",
        teamASlot: "1A",
        teamBSlot: "1B",
        participantsConfirmed: true,
      }),
    ]);

    const match = bracket.stages[0].matches[0];

    expect(match.projected).toBe(false);
    expect(match.teamA).toMatchObject({ team: "Brasil", slot: "1A", projected: false });
    expect(match.teamB).toMatchObject({ team: "Argentina", slot: "1B", projected: false });
  });

  it("falls back to official slots when no participant or projection exists", () => {
    const bracket = buildKnockoutBracket([
      knockoutMatch({ matchNumber: 73, stage: "ROUND_OF_32", teamASlot: "1A", teamBSlot: "2B" }),
    ]);

    const match = bracket.stages[0].matches[0];

    expect(match.projected).toBe(false);
    expect(match.teamA).toMatchObject({ team: null, slot: "1A", projected: false });
    expect(match.teamB).toMatchObject({ team: null, slot: "2B", projected: false });
  });
});

function stageMatchNumbers(
  bracket: ReturnType<typeof buildKnockoutBracket>,
  stage: KnockoutBracketMatchInput["stage"],
) {
  return bracket.stages
    .find((bracketStage) => bracketStage.stage === stage)
    ?.matches.map((match) => match.matchNumber);
}

function groupMatch(
  overrides: Partial<KnockoutBracketMatchInput>,
): KnockoutBracketMatchInput {
  return knockoutMatch({
    stage: "GROUP_STAGE",
    groupCode: "A",
    participantsConfirmed: true,
    teamA: "Time A",
    teamB: "Time B",
    ...overrides,
  });
}

function knockoutMatch(
  overrides: Partial<KnockoutBracketMatchInput>,
): KnockoutBracketMatchInput {
  return {
    id: `match-${overrides.matchNumber ?? 1}`,
    matchNumber: 1,
    stage: "ROUND_OF_32",
    status: "SCHEDULED",
    teamA: null,
    teamB: null,
    teamASlot: null,
    teamBSlot: null,
    groupCode: null,
    participantsConfirmed: false,
    startsAt: date(1),
    venue: "Estádio",
    hostCity: "Cidade",
    teamAScore: null,
    teamBScore: null,
    advancingTeam: null,
    predictions: [],
    ...overrides,
  };
}

function date(day: number) {
  return new Date(`2026-07-${day.toString().padStart(2, "0")}T16:00:00Z`);
}
