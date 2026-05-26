import { describe, expect, it } from "vitest";
import { calculateGroupStandings, hasProvisionalScore } from "@/lib/group-standings";

describe("calculateGroupStandings", () => {
  it("orders scored matches by points, goal difference and goals scored", () => {
    const standings = calculateGroupStandings([
      match("Brasil", "Marrocos", "FINISHED", 2, 0),
      match("Escócia", "Haiti", "FINISHED", 1, 0),
      match("Brasil", "Escócia", "STARTED", 1, 1),
    ]);

    expect(standings.map((row) => row.team)).toEqual([
      "Brasil",
      "Escócia",
      "Haiti",
      "Marrocos",
    ]);
    expect(standings[0]).toMatchObject({
      points: 4,
      played: 2,
      goalsFor: 3,
      goalsAgainst: 1,
      goalDifference: 2,
    });
  });

  it("marks a group as provisional while a live score exists", () => {
    expect(hasProvisionalScore([match("A", "B", "STARTED", 0, 0)])).toBe(true);
    expect(hasProvisionalScore([match("A", "B", "FINISHED", 0, 0)])).toBe(false);
  });
});

function match(
  teamA: string,
  teamB: string,
  status: "SCHEDULED" | "STARTED" | "FINISHED",
  teamAScore: number | null,
  teamBScore: number | null,
) {
  return { teamA, teamB, status, teamAScore, teamBScore };
}
