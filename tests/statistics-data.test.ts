import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPersonalStatistics } from "@/lib/data/statistics";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userFindUniqueOrThrow: vi.fn(),
  matchFindFirst: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth-guards", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    user: { findUniqueOrThrow: mocks.userFindUniqueOrThrow },
    match: { findFirst: mocks.matchFindFirst },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: "current-user" } });
  mocks.matchFindFirst.mockResolvedValue({
    status: "FINISHED",
    advancingTeam: "Brasil",
  });
});

describe("getPersonalStatistics stage totals", () => {
  it("separates game points by stage and adds the champion bonus to the total", async () => {
    mocks.userFindUniqueOrThrow.mockResolvedValue({
      favoriteTeam: null,
      predictedChampion: "Brasil",
      predictions: [
        prediction("GROUP_STAGE", "STARTED", 7, 2, 1),
        prediction("FINAL", "FINISHED", 100, 1, 0),
        prediction("ROUND_OF_16", "SCHEDULED", 0, null, null),
      ],
    });

    const statistics = await getPersonalStatistics();

    expect(statistics.gamePoints).toBe(107);
    expect(statistics.championBonusPoints).toBe(200);
    expect(statistics.totalPoints).toBe(307);
    expect(statistics.provisional).toBe(true);
    expect(statistics.stagePoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "GROUP_STAGE", points: 7 }),
        expect.objectContaining({ stage: "ROUND_OF_16", points: 0 }),
        expect.objectContaining({ stage: "FINAL", points: 100 }),
      ]),
    );
  });
});

function prediction(
  stage: string,
  status: string,
  points: number,
  teamAScore: number | null,
  teamBScore: number | null,
) {
  return {
    teamAScore: 2,
    teamBScore: 1,
    predictedAdvancingTeam: null,
    points,
    match: {
      stage,
      status,
      teamAScore,
      teamBScore,
      advancingTeam: null,
    },
  };
}
