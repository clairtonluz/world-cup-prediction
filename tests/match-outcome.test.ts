import { describe, expect, it } from "vitest";
import { officialMatchOutcomeLabel } from "@/lib/match-outcome";

describe("officialMatchOutcomeLabel", () => {
  it("hides the outcome when no advancing team is available", () => {
    expect(officialMatchOutcomeLabel("ROUND_OF_16", null)).toBeNull();
  });

  it("hides the outcome for group-stage matches", () => {
    expect(officialMatchOutcomeLabel("GROUP_STAGE", "Brasil")).toBeNull();
  });

  it("labels knockout phase winners as classified teams", () => {
    expect(officialMatchOutcomeLabel("ROUND_OF_32", "Brasil")).toBe("Classificada");
    expect(officialMatchOutcomeLabel("ROUND_OF_16", "Brasil")).toBe("Classificada");
    expect(officialMatchOutcomeLabel("QUARTER_FINALS", "Brasil")).toBe("Classificada");
    expect(officialMatchOutcomeLabel("SEMI_FINALS", "Brasil")).toBe("Classificada");
  });

  it("labels the final winner as champion", () => {
    expect(officialMatchOutcomeLabel("FINAL", "Brasil")).toBe("Campeão");
  });

  it("labels the third-place match winner", () => {
    expect(officialMatchOutcomeLabel("THIRD_PLACE_MATCH", "Brasil")).toBe("Vencedor");
  });
});
