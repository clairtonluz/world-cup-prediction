import { beforeEach, describe, expect, it, vi } from "vitest";
import { getChampionPredictionFormData } from "@/lib/data/tournament-predictions";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userFindUniqueOrThrow: vi.fn(),
  matchFindFirst: vi.fn(),
  matchFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth-guards", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    user: { findUniqueOrThrow: mocks.userFindUniqueOrThrow },
    match: {
      findFirst: mocks.matchFindFirst,
      findMany: mocks.matchFindMany,
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: "current-user" } });
  mocks.userFindUniqueOrThrow.mockResolvedValue({ predictedChampion: "Brasil" });
  mocks.matchFindFirst.mockResolvedValue({
    startsAt: new Date("2099-06-28T19:00:00Z"),
    status: "SCHEDULED",
  });
  mocks.matchFindMany.mockResolvedValue([
    { teamA: "Brasil", teamB: "Argentina" },
    { teamA: "Franca", teamB: "Brasil" },
  ]);
});

describe("getChampionPredictionFormData", () => {
  it("uses the first knockout match as the champion prediction deadline", async () => {
    const formData = await getChampionPredictionFormData();

    expect(mocks.matchFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stage: "ROUND_OF_32" },
      }),
    );
    expect(formData).toEqual({
      predictedChampion: "Brasil",
      teams: ["Argentina", "Brasil", "Franca"],
      editable: true,
      closesAt: new Date("2099-06-28T19:00:00Z"),
    });
  });
});
