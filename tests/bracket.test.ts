import { describe, expect, it } from "vitest";
import { resolveBracketParticipants, type BracketMatch } from "@/lib/bracket";
import { GROUP_CODES, type GroupCodeValue } from "@/lib/group-standings";

describe("resolveBracketParticipants", () => {
  it("uses the official FIFA third-place allocation matrix for the round of 32", () => {
    const groups = GROUP_CODES.flatMap(groupFixtures);
    const roundOf32 = baseMatch({
      matchNumber: 79,
      stage: "ROUND_OF_32",
      teamASlot: "1A",
      teamBSlot: "3CEFHI",
    });

    const resolution = resolveBracketParticipants([...groups, roundOf32]).get(79);

    expect(resolution).toEqual({
      teamA: "A1",
      teamB: "H3",
      participantsConfirmed: true,
      projected: false,
    });
  });

  it("sends confirmed semifinal winners to the final and losers to third place", () => {
    const semiA = baseMatch({
      matchNumber: 101,
      stage: "SEMI_FINALS",
      status: "FINISHED",
      teamA: "Brasil",
      teamB: "Espanha",
      teamAScore: 1,
      teamBScore: 1,
      advancingTeam: "Brasil",
    });
    const semiB = baseMatch({
      matchNumber: 102,
      stage: "SEMI_FINALS",
      status: "FINISHED",
      teamA: "Argentina",
      teamB: "França",
      teamAScore: 0,
      teamBScore: 2,
      advancingTeam: "França",
    });

    const resolutions = resolveBracketParticipants([
      semiA,
      semiB,
      baseMatch({ matchNumber: 103, stage: "THIRD_PLACE_MATCH", teamASlot: "RU101", teamBSlot: "RU102" }),
      baseMatch({ matchNumber: 104, stage: "FINAL", teamASlot: "W101", teamBSlot: "W102" }),
    ]);

    expect(resolutions.get(103)).toMatchObject({
      teamA: "Espanha",
      teamB: "Argentina",
      participantsConfirmed: true,
    });
    expect(resolutions.get(104)).toMatchObject({
      teamA: "Brasil",
      teamB: "França",
      participantsConfirmed: true,
    });
  });

  it("does not invent a projected winner during a tied live knockout match", () => {
    const liveTie = baseMatch({
      matchNumber: 101,
      stage: "SEMI_FINALS",
      status: "STARTED",
      teamA: "Brasil",
      teamB: "Espanha",
      teamAScore: 1,
      teamBScore: 1,
    });
    const final = baseMatch({ matchNumber: 104, stage: "FINAL", teamASlot: "W101", teamBSlot: "W102" });

    expect(resolveBracketParticipants([liveTie, final]).get(104)?.teamA).toBeNull();
  });
});

function groupFixtures(groupCode: GroupCodeValue) {
  const teams = [1, 2, 3, 4].map((number) => `${groupCode}${number}`);
  const results = [
    [0, 1, 3, 0],
    [0, 2, 3, 0],
    [0, 3, 3, 0],
    [1, 2, 2, 0],
    [1, 3, 2, 0],
    [2, 3, 1, 0],
  ];
  return results.map(([a, b, scoreA, scoreB], index) =>
    baseMatch({
      matchNumber: GROUP_CODES.indexOf(groupCode) * 6 + index + 1,
      stage: "GROUP_STAGE",
      status: "FINISHED",
      teamA: teams[a],
      teamB: teams[b],
      groupCode,
      teamAScore: scoreA,
      teamBScore: scoreB,
    }),
  );
}

function baseMatch(overrides: Partial<BracketMatch>): BracketMatch {
  return {
    matchNumber: 1,
    stage: "ROUND_OF_32",
    status: "SCHEDULED",
    teamA: null,
    teamB: null,
    teamASlot: null,
    teamBSlot: null,
    groupCode: null,
    teamAScore: null,
    teamBScore: null,
    advancingTeam: null,
    ...overrides,
  };
}
