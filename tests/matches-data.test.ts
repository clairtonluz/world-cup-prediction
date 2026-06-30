import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMatchDetail, listMatches } from "@/lib/data/matches";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  matchFindUnique: vi.fn(),
  matchFindMany: vi.fn(),
  friendGroupFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("@/lib/auth-guards", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    match: { findMany: mocks.matchFindMany, findUnique: mocks.matchFindUnique },
    friendGroup: { findMany: mocks.friendGroupFindMany },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: "current" } });
  mocks.matchFindMany.mockResolvedValue([]);
});

describe("listMatches display points", () => {
  it("returns current display points for the current user's match predictions", async () => {
    mocks.matchFindMany.mockResolvedValue([
      scoredKnockoutMatch({
        predictions: [
          {
            teamAScore: 3,
            teamBScore: 1,
            predictedAdvancingTeam: "Brasil",
            points: 0,
          },
        ],
      }),
    ]);

    const matches = await listMatches();

    expect(matches[0].predictions[0].points).toBe(12);
  });
});

describe("getMatchDetail prediction visibility", () => {
  it("does not load other knockout predictions before kickoff", async () => {
    mocks.matchFindUnique.mockResolvedValue(matchAt("2099-06-11T19:00:00Z", "SCHEDULED"));

    const match = await getMatchDetail("match");

    expect(match.comparisonPredictionGroups).toBeNull();
    expect(mocks.friendGroupFindMany).not.toHaveBeenCalled();
  });

  it("returns current display points for friend predictions after kickoff", async () => {
    mocks.matchFindUnique.mockResolvedValue(scoredKnockoutMatch());
    mocks.friendGroupFindMany.mockResolvedValue([
      {
        id: "group",
        name: "Grupo da Copa",
        members: [
          {
            user: {
              id: "friend",
              name: "Amigo",
              image: null,
              predictions: [
                {
                  id: "friend-prediction",
                  teamAScore: 3,
                  teamBScore: 1,
                  predictedAdvancingTeam: "Brasil",
                  points: 0,
                },
              ],
            },
          },
        ],
      },
    ]);

    const match = await getMatchDetail("match");

    expect(match.comparisonPredictionGroups?.[0].predictions[0]).toMatchObject({
      id: "friend-prediction",
      points: 12,
    });
  });

  it("loads predictions grouped by friend groups shared with the current user after kickoff", async () => {
    mocks.matchFindUnique.mockResolvedValue(matchAt("2020-06-11T19:00:00Z", "STARTED"));
    mocks.friendGroupFindMany.mockResolvedValue([
      {
        id: "group",
        name: "Grupo da Copa",
        members: [
          {
            user: {
              id: "current",
              name: "Pessoa Atual",
              image: null,
              predictions: [
                {
                  id: "current-prediction",
                  teamAScore: 2,
                  teamBScore: 1,
                  predictedAdvancingTeam: null,
                  points: 5,
                },
              ],
            },
          },
          {
            user: {
              id: "friend",
              name: "Amigo",
              image: null,
              predictions: [
                {
                  id: "friend-prediction",
                  teamAScore: 1,
                  teamBScore: 1,
                  predictedAdvancingTeam: "Brasil",
                  points: 0,
                },
              ],
            },
          },
        ],
      },
    ]);

    const match = await getMatchDetail("match");

    expect(match.comparisonPredictionGroups).toEqual([
      {
        id: "group",
        name: "Grupo da Copa",
        predictions: [
          {
            id: "current-prediction",
            teamAScore: 2,
            teamBScore: 1,
            predictedAdvancingTeam: null,
            points: 5,
            user: { id: "current", name: "Pessoa Atual", image: null },
          },
          {
            id: "friend-prediction",
            teamAScore: 1,
            teamBScore: 1,
            predictedAdvancingTeam: "Brasil",
            points: 0,
            user: { id: "friend", name: "Amigo", image: null },
          },
        ],
      },
    ]);
    expect(mocks.friendGroupFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { members: { some: { userId: "current" } } },
            {
              members: {
                some: {
                  user: {
                    predictions: { some: { matchId: "match" } },
                  },
                },
              },
            },
          ],
        },
        select: expect.objectContaining({
          members: expect.objectContaining({
            where: {
              user: {
                predictions: { some: { matchId: "match" } },
              },
            },
            select: expect.objectContaining({
              user: expect.objectContaining({
                select: expect.objectContaining({
                  predictions: expect.objectContaining({
                    where: { matchId: "match" },
                    select: expect.objectContaining({ predictedAdvancingTeam: true }),
                  }),
                }),
              }),
            }),
          }),
        }),
        orderBy: [{ name: "asc" }, { id: "asc" }],
      }),
    );
  });
});

function matchAt(startsAt: string, status: "SCHEDULED" | "STARTED") {
  return {
    id: "match",
    startsAt: new Date(startsAt),
    status,
    stage: "GROUP_STAGE",
    teamAScore: null,
    teamBScore: null,
    advancingTeam: null,
    predictions: [],
  };
}

function scoredKnockoutMatch(overrides = {}) {
  return {
    id: "match",
    matchNumber: 1,
    fifaMatchId: "fifa-match",
    espnEventId: null,
    scoreSyncLocked: false,
    teamA: "Brasil",
    teamB: "Argentina",
    teamASlot: null,
    teamBSlot: null,
    participantsConfirmed: true,
    stage: "ROUND_OF_16",
    groupCode: null,
    groupRound: null,
    startsAt: new Date("2020-06-11T19:00:00Z"),
    venue: "Estadio",
    hostCity: "Cidade",
    status: "FINISHED",
    teamAScore: 2,
    teamBScore: 1,
    advancingTeam: "Brasil",
    predictionsResetAt: null,
    predictions: [],
    ...overrides,
  };
}
