import { beforeEach, describe, expect, it, vi } from "vitest";
import { listPersonalPredictions } from "@/lib/data/predictions";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  predictionFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth-guards", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    prediction: { findMany: mocks.predictionFindMany },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: "current-user" } });
  mocks.predictionFindMany.mockResolvedValue([]);
});

describe("listPersonalPredictions", () => {
  it("loads only the authenticated user's predictions in fixture order", async () => {
    await expect(listPersonalPredictions()).resolves.toEqual([]);

    expect(mocks.requireUser).toHaveBeenCalled();
    expect(mocks.predictionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "current-user" },
        select: expect.objectContaining({
          teamAScore: true,
          teamBScore: true,
          points: true,
          match: {
            select: expect.objectContaining({
              startsAt: true,
              status: true,
              participantsConfirmed: true,
              advancingTeam: true,
            }),
          },
        }),
        orderBy: [
          { match: { startsAt: "asc" } },
          { match: { matchNumber: "asc" } },
        ],
      }),
    );
  });

  it("returns current display points when stored points are stale", async () => {
    mocks.predictionFindMany.mockResolvedValue([
      {
        id: "prediction",
        teamAScore: 3,
        teamBScore: 1,
        predictedAdvancingTeam: "Brasil",
        points: 0,
        match: {
          id: "match",
          matchNumber: 89,
          teamA: "Brasil",
          teamB: "Argentina",
          teamASlot: null,
          teamBSlot: null,
          participantsConfirmed: true,
          stage: "ROUND_OF_16",
          startsAt: new Date("2020-06-11T19:00:00Z"),
          status: "FINISHED",
          teamAScore: 2,
          teamBScore: 1,
          advancingTeam: "Brasil",
        },
      },
    ]);

    const predictions = await listPersonalPredictions();

    expect(predictions[0].points).toBe(12);
  });
});
