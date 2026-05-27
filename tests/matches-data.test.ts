import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMatchDetail } from "@/lib/data/matches";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  matchFindUnique: vi.fn(),
  predictionFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("@/lib/auth-guards", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    match: { findUnique: mocks.matchFindUnique },
    prediction: { findMany: mocks.predictionFindMany },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: "current" } });
});

describe("getMatchDetail prediction visibility", () => {
  it("does not load other knockout predictions before kickoff", async () => {
    mocks.matchFindUnique.mockResolvedValue(matchAt("2099-06-11T19:00:00Z", "SCHEDULED"));

    const match = await getMatchDetail("match");

    expect(match.comparisonPredictions).toBeNull();
    expect(mocks.predictionFindMany).not.toHaveBeenCalled();
  });

  it("includes classified-team predictions after kickoff", async () => {
    mocks.matchFindUnique.mockResolvedValue(matchAt("2020-06-11T19:00:00Z", "STARTED"));
    mocks.predictionFindMany.mockResolvedValue([
      {
        id: "prediction",
        teamAScore: 1,
        teamBScore: 1,
        predictedAdvancingTeam: "Brasil",
        points: 0,
        user: { id: "friend", name: "Amigo", image: null },
      },
    ]);

    const match = await getMatchDetail("match");

    expect(match.comparisonPredictions?.[0].predictedAdvancingTeam).toBe("Brasil");
    expect(mocks.predictionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ predictedAdvancingTeam: true }),
      }),
    );
  });
});

function matchAt(startsAt: string, status: "SCHEDULED" | "STARTED") {
  return {
    id: "match",
    startsAt: new Date(startsAt),
    status,
    predictions: [],
  };
}
