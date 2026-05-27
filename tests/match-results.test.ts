import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { recalculateAllMatchPredictions } from "@/lib/match-results";

const mocks = vi.hoisted(() => ({
  matchFindMany: vi.fn(),
  predictionFindMany: vi.fn(),
  predictionUpdate: vi.fn(),
  predictionUpdateMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recalculateAllMatchPredictions", () => {
  it("processes every match and zeroes predictions for matches without scores", async () => {
    mocks.matchFindMany.mockResolvedValue([
      scoredMatch("finished", 2, 1),
      scoredMatch("scheduled", null, null),
    ]);
    mocks.predictionFindMany.mockResolvedValue([
      {
        id: "prediction",
        teamAScore: 2,
        teamBScore: 1,
        predictedAdvancingTeam: null,
      },
    ]);

    await recalculateAllMatchPredictions(transaction());

    expect(mocks.matchFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          stage: true,
          teamAScore: true,
          teamBScore: true,
          advancingTeam: true,
        },
        orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }],
      }),
    );
    expect(mocks.predictionFindMany).toHaveBeenCalledWith({
      where: { matchId: "finished" },
    });
    expect(mocks.predictionUpdate).toHaveBeenCalledWith({
      where: { id: "prediction" },
      data: { points: 10 },
    });
    expect(mocks.predictionUpdateMany).toHaveBeenCalledWith({
      where: { matchId: "scheduled" },
      data: { points: 0 },
    });
  });
});

function transaction() {
  return {
    match: { findMany: mocks.matchFindMany },
    prediction: {
      findMany: mocks.predictionFindMany,
      update: mocks.predictionUpdate,
      updateMany: mocks.predictionUpdateMany,
    },
  } as unknown as Prisma.TransactionClient;
}

function scoredMatch(id: string, teamAScore: number | null, teamBScore: number | null) {
  return {
    id,
    stage: "GROUP_STAGE",
    teamAScore,
    teamBScore,
    advancingTeam: null,
  };
}
