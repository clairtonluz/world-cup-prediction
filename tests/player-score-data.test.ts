import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlayerScorePageData } from "@/lib/data/player-score";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  notFound: vi.fn(),
  userFindUnique: vi.fn(),
  matchFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));
vi.mock("@/lib/auth-guards", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    user: { findUnique: mocks.userFindUnique },
    match: { findMany: mocks.matchFindMany },
  }),
}));

const PLAYER_ID = "cplayer123";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: "current-user" } });
  mocks.notFound.mockImplementation(() => {
    throw new Error("not-found");
  });
  mocks.userFindUnique.mockResolvedValue({
    id: PLAYER_ID,
    name: "Jogador Oculto",
    image: null,
    hiddenFromGlobalRanking: true,
  });
  mocks.matchFindMany.mockResolvedValue([]);
});

describe("getPlayerScorePageData", () => {
  it("requires authentication before reading player scores", async () => {
    mocks.requireUser.mockRejectedValue(new Error("forbidden"));

    await expect(getPlayerScorePageData(PLAYER_ID)).rejects.toThrow("forbidden");

    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.matchFindMany).not.toHaveBeenCalled();
  });

  it("returns not found for invalid player ids", async () => {
    await expect(getPlayerScorePageData("invalid")).rejects.toThrow("not-found");

    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.matchFindMany).not.toHaveBeenCalled();
  });

  it("returns not found when the player does not exist", async () => {
    mocks.userFindUnique.mockResolvedValue(null);

    await expect(getPlayerScorePageData(PLAYER_ID)).rejects.toThrow("not-found");

    expect(mocks.matchFindMany).not.toHaveBeenCalled();
  });

  it("lets any authenticated user load an existing player, including hidden ranking players", async () => {
    await expect(getPlayerScorePageData(PLAYER_ID)).resolves.toMatchObject({
      player: {
        id: PLAYER_ID,
        name: "Jogador Oculto",
      },
    });

    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { id: PLAYER_ID },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });
  });

  it("queries only finished and live matches in fixture order", async () => {
    await getPlayerScorePageData(PLAYER_ID);

    expect(mocks.matchFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ["FINISHED", "STARTED"] } },
        select: expect.objectContaining({
          predictions: expect.objectContaining({
            where: { userId: PLAYER_ID },
          }),
        }),
        orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }],
      }),
    );
  });

  it("includes finished and live matches, with zero points for missing predictions or live matches without scores", async () => {
    mocks.matchFindMany.mockResolvedValue([
      match({
        id: "finished-without-prediction",
        status: "FINISHED",
        teamAScore: 1,
        teamBScore: 0,
        predictions: [],
      }),
      match({
        id: "live-without-score",
        status: "STARTED",
        teamAScore: null,
        teamBScore: null,
        predictions: [prediction({ points: 10 })],
      }),
    ]);

    const data = await getPlayerScorePageData(PLAYER_ID);

    expect(data.matches).toEqual([
      expect.objectContaining({
        id: "finished-without-prediction",
        prediction: null,
        points: 0,
      }),
      expect.objectContaining({
        id: "live-without-score",
        prediction: expect.objectContaining({ teamAScore: 2, teamBScore: 1 }),
        points: 0,
      }),
    ]);
    expect(data.summary).toMatchObject({
      totalPoints: 0,
      matchesConsidered: 2,
      submittedPredictions: 1,
      missingPredictions: 1,
      provisional: true,
    });
  });

  it("recalculates points for predictions with official scores", async () => {
    mocks.matchFindMany.mockResolvedValue([
      match({
        id: "knockout",
        stage: "ROUND_OF_16",
        teamA: "Brasil",
        teamB: "Argentina",
        teamAScore: 2,
        teamBScore: 1,
        advancingTeam: "Brasil",
        predictions: [
          prediction({
            teamAScore: 3,
            teamBScore: 1,
            predictedAdvancingTeam: "Brasil",
            points: 0,
          }),
        ],
      }),
    ]);

    const data = await getPlayerScorePageData(PLAYER_ID);

    expect(data.matches[0]).toMatchObject({
      id: "knockout",
      points: 12,
    });
    expect(data.summary).toMatchObject({
      totalPoints: 12,
      submittedPredictions: 1,
      exactPredictions: 0,
      correctResults: 1,
      correctAdvancingTeams: 1,
    });
  });

  it("adds the running total after each match in fixture order", async () => {
    mocks.matchFindMany.mockResolvedValue([
      match({
        id: "match-1",
        teamAScore: 2,
        teamBScore: 1,
        predictions: [prediction({ teamAScore: 2, teamBScore: 1, points: 0 })],
      }),
      match({
        id: "match-2",
        teamAScore: 1,
        teamBScore: 1,
        predictions: [],
      }),
      match({
        id: "match-3",
        teamAScore: 3,
        teamBScore: 1,
        predictions: [prediction({ teamAScore: 1, teamBScore: 0, points: 0 })],
      }),
    ]);

    const data = await getPlayerScorePageData(PLAYER_ID);

    expect(data.matches.map((match) => ({
      id: match.id,
      points: match.points,
      cumulativePoints: match.cumulativePoints,
    }))).toEqual([
      { id: "match-1", points: 10, cumulativePoints: 10 },
      { id: "match-2", points: 0, cumulativePoints: 10 },
      { id: "match-3", points: 3, cumulativePoints: 13 },
    ]);
  });

  it("counts exact predictions and correct results in the summary", async () => {
    mocks.matchFindMany.mockResolvedValue([
      match({
        teamAScore: 2,
        teamBScore: 1,
        predictions: [prediction({ teamAScore: 2, teamBScore: 1, points: 0 })],
      }),
    ]);

    const data = await getPlayerScorePageData(PLAYER_ID);

    expect(data.summary).toMatchObject({
      totalPoints: 10,
      exactPredictions: 1,
      correctResults: 1,
    });
  });
});

function match(overrides = {}) {
  return {
    id: "match",
    matchNumber: 1,
    teamA: "Brasil",
    teamB: "Argentina",
    teamASlot: null,
    teamBSlot: null,
    participantsConfirmed: true,
    stage: "GROUP_STAGE",
    startsAt: new Date("2026-06-11T19:00:00Z"),
    status: "FINISHED",
    teamAScore: 2,
    teamBScore: 1,
    advancingTeam: null,
    predictions: [],
    ...overrides,
  };
}

function prediction(overrides = {}) {
  return {
    id: "prediction",
    teamAScore: 2,
    teamBScore: 1,
    predictedAdvancingTeam: null,
    points: 0,
    ...overrides,
  };
}
