import { describe, expect, it } from "vitest";
import {
  filterKnockoutStagesFrom,
  toggleKnockoutStageFilter,
} from "@/lib/knockout-bracket-filter";
import type { KnockoutBracketStage } from "@/lib/knockout-bracket";

describe("knockout bracket stage filter", () => {
  it("shows all stages when no filter is selected", () => {
    expect(filterKnockoutStagesFrom(stages(), null).map((stage) => stage.stage)).toEqual([
      "ROUND_OF_32",
      "ROUND_OF_16",
      "QUARTER_FINALS",
      "SEMI_FINALS",
      "FINAL",
      "THIRD_PLACE_MATCH",
    ]);
  });

  it("shows the selected stage and following stages", () => {
    expect(filterKnockoutStagesFrom(stages(), "ROUND_OF_16").map((stage) => stage.stage)).toEqual([
      "ROUND_OF_16",
      "QUARTER_FINALS",
      "SEMI_FINALS",
      "FINAL",
      "THIRD_PLACE_MATCH",
    ]);
  });

  it("toggles the selected stage off when clicked again", () => {
    expect(toggleKnockoutStageFilter("ROUND_OF_16", "ROUND_OF_16")).toBeNull();
  });

  it("switches the selected stage when another stage is clicked", () => {
    expect(toggleKnockoutStageFilter("ROUND_OF_16", "QUARTER_FINALS")).toBe("QUARTER_FINALS");
  });
});

function stages(): KnockoutBracketStage[] {
  return [
    "ROUND_OF_32",
    "ROUND_OF_16",
    "QUARTER_FINALS",
    "SEMI_FINALS",
    "FINAL",
    "THIRD_PLACE_MATCH",
  ].map((stage) => ({
    stage,
    label: stage,
    matches: [],
  })) as KnockoutBracketStage[];
}
