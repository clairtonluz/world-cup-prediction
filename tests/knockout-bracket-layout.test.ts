import { describe, expect, it } from "vitest";
import { buildKnockoutBracketLayout } from "@/lib/knockout-bracket-layout";
import type {
  KnockoutBracketMatch,
  KnockoutBracketStage,
  KnockoutStageValue,
} from "@/lib/knockout-bracket";

describe("buildKnockoutBracketLayout", () => {
  it("splits the full bracket into left and right paths", () => {
    const layout = buildKnockoutBracketLayout(stages(), null);

    expect(sideNumbers(layout.leftColumns)).toEqual([
      ["ROUND_OF_32", [73, 74, 75, 76, 77, 78, 79, 80]],
      ["ROUND_OF_16", [89, 90, 91, 92]],
      ["QUARTER_FINALS", [97, 98]],
      ["SEMI_FINALS", [101]],
    ]);
    expect(sideNumbers(layout.rightColumns)).toEqual([
      ["SEMI_FINALS", [102]],
      ["QUARTER_FINALS", [99, 100]],
      ["ROUND_OF_16", [93, 94, 95, 96]],
      ["ROUND_OF_32", [81, 82, 83, 84, 85, 86, 87, 88]],
    ]);
  });

  it("starts both desktop paths at the selected quarterfinal phase", () => {
    const layout = buildKnockoutBracketLayout(stages(), "QUARTER_FINALS");

    expect(sideNumbers(layout.leftColumns)).toEqual([
      ["QUARTER_FINALS", [97, 98]],
      ["SEMI_FINALS", [101]],
    ]);
    expect(sideNumbers(layout.rightColumns)).toEqual([
      ["SEMI_FINALS", [102]],
      ["QUARTER_FINALS", [99, 100]],
    ]);
  });

  it("shows final and third-place matches when the final phase is selected", () => {
    const layout = buildKnockoutBracketLayout(stages(), "FINAL");

    expect(layout.leftColumns).toEqual([]);
    expect(layout.rightColumns).toEqual([]);
    expect(layout.finalMatch?.matchNumber).toBe(104);
    expect(layout.thirdPlaceMatch?.matchNumber).toBe(103);
    expect(layout.mobileColumns.map((column) => matchNumbers(column.matches))).toEqual([
      [104, 103],
    ]);
  });

  it("shows only the third-place match when that phase is selected", () => {
    const layout = buildKnockoutBracketLayout(stages(), "THIRD_PLACE_MATCH");

    expect(layout.leftColumns).toEqual([]);
    expect(layout.rightColumns).toEqual([]);
    expect(layout.finalMatch).toBeNull();
    expect(layout.thirdPlaceMatch?.matchNumber).toBe(103);
    expect(layout.mobileColumns.map((column) => matchNumbers(column.matches))).toEqual([
      [103],
    ]);
  });
});

function sideNumbers(
  columns: ReturnType<typeof buildKnockoutBracketLayout>["leftColumns"],
) {
  return columns.map((column) => [column.stage, matchNumbers(column.matches)]);
}

function matchNumbers(matches: KnockoutBracketMatch[]) {
  return matches.map((match) => match.matchNumber);
}

function stages(): KnockoutBracketStage[] {
  return [
    stage("ROUND_OF_32", [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88]),
    stage("ROUND_OF_16", [89, 90, 91, 92, 93, 94, 95, 96]),
    stage("QUARTER_FINALS", [97, 98, 99, 100]),
    stage("SEMI_FINALS", [101, 102]),
    stage("FINAL", [104]),
    stage("THIRD_PLACE_MATCH", [103]),
  ];
}

function stage(
  stageValue: KnockoutStageValue,
  matchNumbersValue: number[],
): KnockoutBracketStage {
  return {
    stage: stageValue,
    label: stageValue,
    matches: matchNumbersValue.map((matchNumber) => match(matchNumber, stageValue)),
  };
}

function match(
  matchNumber: number,
  stageValue: KnockoutStageValue,
): KnockoutBracketMatch {
  return {
    id: `match-${matchNumber}`,
    matchNumber,
    stage: stageValue,
    startsAt: new Date("2026-07-01T16:00:00Z"),
    venue: "Estádio",
    hostCity: "Cidade",
    status: "SCHEDULED",
    teamAScore: null,
    teamBScore: null,
    advancingTeam: null,
    participantsConfirmed: false,
    projected: false,
    sourceMatchNumbers: [],
    teamA: { team: null, slot: null, projected: false },
    teamB: { team: null, slot: null, projected: false },
    prediction: null,
  };
}
