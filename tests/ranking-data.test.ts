import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRankingContext } from "@/lib/data/ranking";

const mocks = vi.hoisted(() => ({
  matchFindFirst: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth-guards", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    match: { findFirst: mocks.matchFindFirst },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getRankingContext", () => {
  it("reveals individual champion predictions only after the knockout deadline starts", async () => {
    mocks.matchFindFirst
      .mockResolvedValueOnce({
        startsAt: new Date("2099-06-28T19:00:00Z"),
        status: "SCHEDULED",
      })
      .mockResolvedValueOnce({
        status: "FINISHED",
        advancingTeam: "Brasil",
      });

    const context = await getRankingContext();

    expect(mocks.matchFindFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { stage: "ROUND_OF_32" },
      }),
    );
    expect(mocks.matchFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { stage: "FINAL" },
      }),
    );
    expect(context).toEqual({
      officialChampion: "Brasil",
      revealPredictedChampion: false,
    });
  });

  it("reveals individual champion predictions once the knockout deadline has started", async () => {
    mocks.matchFindFirst
      .mockResolvedValueOnce({
        startsAt: new Date("2099-06-28T19:00:00Z"),
        status: "STARTED",
      })
      .mockResolvedValueOnce({
        status: "STARTED",
        advancingTeam: null,
      });

    await expect(getRankingContext()).resolves.toEqual({
      officialChampion: null,
      revealPredictedChampion: true,
    });
  });
});
