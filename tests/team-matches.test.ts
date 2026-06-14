import { describe, expect, it } from "vitest";
import { parseTeamSearchParam, teamMatchesHref } from "@/lib/team-matches";

describe("parseTeamSearchParam", () => {
  it("accepts a single trimmed team value", () => {
    expect(parseTeamSearchParam(" Brasil ")).toBe("Brasil");
  });

  it("rejects missing, empty, repeated, and oversized values", () => {
    expect(parseTeamSearchParam(undefined)).toBeNull();
    expect(parseTeamSearchParam(" ")).toBeNull();
    expect(parseTeamSearchParam(["Brasil", "Argentina"])).toBeNull();
    expect(parseTeamSearchParam("a".repeat(81))).toBeNull();
  });
});

describe("teamMatchesHref", () => {
  it("encodes team names in the matches team query", () => {
    expect(teamMatchesHref("Costa do Marfim")).toBe(
      "/matches?team=Costa+do+Marfim",
    );
    expect(teamMatchesHref("África do Sul")).toBe(
      "/matches?team=%C3%81frica+do+Sul",
    );
  });

  it("returns no href for unresolved teams", () => {
    expect(teamMatchesHref(null)).toBeNull();
    expect(teamMatchesHref("")).toBeNull();
  });
});
