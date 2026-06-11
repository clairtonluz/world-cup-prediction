import { beforeEach, describe, expect, it, vi } from "vitest";
import { runAutomaticScoreSync } from "@/lib/score-sync/sync";

const mocks = vi.hoisted(() => ({
  settingsUpsert: vi.fn(),
  settingsUpdate: vi.fn(),
  settingsUpdateMany: vi.fn(),
  matchFindMany: vi.fn(),
  fetchEspnScoreboard: vi.fn(),
  runSerializableTransaction: vi.fn(),
  applyMatchResult: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    scoreSyncSettings: {
      upsert: mocks.settingsUpsert,
      update: mocks.settingsUpdate,
      updateMany: mocks.settingsUpdateMany,
    },
    match: { findMany: mocks.matchFindMany },
  }),
}));
vi.mock("@/lib/score-sync/client", () => ({
  EspnScoreboardRequestError: class EspnScoreboardRequestError extends Error {},
  fetchEspnScoreboard: mocks.fetchEspnScoreboard,
}));
vi.mock("@/lib/transactions", () => ({
  runSerializableTransaction: mocks.runSerializableTransaction,
}));
vi.mock("@/lib/match-result-application", () => ({
  applyMatchResult: mocks.applyMatchResult,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.settingsUpsert.mockResolvedValue({
    id: "default",
    enabled: true,
    intervalMinutes: 10,
    lastSyncFinishedAt: null,
  });
  mocks.settingsUpdateMany.mockResolvedValue({ count: 1 });
  mocks.settingsUpdate.mockResolvedValue({});
  mocks.runSerializableTransaction.mockImplementation((operation) => operation({}));
  mocks.applyMatchResult.mockResolvedValue({ error: null, propagation: null });
});

describe("runAutomaticScoreSync", () => {
  it("does not call ESPN when automatic sync is disabled", async () => {
    mocks.settingsUpsert.mockResolvedValue({
      id: "default",
      enabled: false,
      intervalMinutes: 10,
      lastSyncFinishedAt: null,
    });

    const result = await runAutomaticScoreSync(new Date("2026-06-11T19:00:00Z"));

    expect(result.status).toBe("disabled");
    expect(mocks.matchFindMany).not.toHaveBeenCalled();
    expect(mocks.fetchEspnScoreboard).not.toHaveBeenCalled();
  });

  it("does not call ESPN before any returned match is eligible", async () => {
    mocks.matchFindMany.mockResolvedValue([
      {
        id: "match",
        matchNumber: 1,
        espnEventId: "760415",
        scoreSyncLocked: false,
        startsAt: new Date("2026-06-11T19:00:00Z"),
        status: "SCHEDULED",
        stage: "GROUP_STAGE",
        teamA: "Brasil",
        teamB: "Argentina",
      },
    ]);

    const result = await runAutomaticScoreSync(new Date("2026-06-11T18:59:00Z"));

    expect(result.status).toBe("no_matches");
    expect(mocks.fetchEspnScoreboard).not.toHaveBeenCalled();
  });

  it("applies an eligible in-progress ESPN event as a started match", async () => {
    mocks.matchFindMany.mockResolvedValue([match()]);
    mocks.fetchEspnScoreboard.mockResolvedValue([
      event({ state: "in", homeScore: "1", awayScore: "0" }),
    ]);

    const result = await runAutomaticScoreSync(new Date("2026-06-11T19:05:00Z"));

    expect(result.status).toBe("completed");
    expect(result.updatedMatches).toBe(1);
    expect(mocks.applyMatchResult).toHaveBeenCalledWith(expect.any(Object), "match", {
      status: "STARTED",
      teamAScore: 1,
      teamBScore: 0,
      advancingTeam: null,
    });
  });

  it("applies an eligible completed ESPN event as a finished match", async () => {
    mocks.matchFindMany.mockResolvedValue([match({ status: "STARTED" })]);
    mocks.fetchEspnScoreboard.mockResolvedValue([
      event({ state: "post", completed: true, homeScore: "2", awayScore: "1" }),
    ]);

    const result = await runAutomaticScoreSync(new Date("2026-06-11T20:55:00Z"));

    expect(result.status).toBe("completed");
    expect(result.updatedMatches).toBe(1);
    expect(mocks.applyMatchResult).toHaveBeenCalledWith(expect.any(Object), "match", {
      status: "FINISHED",
      teamAScore: 2,
      teamBScore: 1,
      advancingTeam: null,
    });
  });
});

function match(overrides = {}) {
  return {
    id: "match",
    matchNumber: 1,
    espnEventId: "760415",
    scoreSyncLocked: false,
    startsAt: new Date("2026-06-11T19:00:00Z"),
    status: "SCHEDULED",
    stage: "GROUP_STAGE",
    teamA: "Brasil",
    teamB: "Argentina",
    ...overrides,
  };
}

function event({
  state,
  completed = false,
  homeScore = "0",
  awayScore = "0",
}: {
  state: string;
  completed?: boolean;
  homeScore?: string;
  awayScore?: string;
}) {
  return {
    id: "760415",
    date: "2026-06-11T19:00Z",
    status: {
      type: { state, completed },
    },
    competitions: [
      {
        competitors: [
          {
            homeAway: "home",
            score: homeScore,
            team: { displayName: "Brasil" },
          },
          {
            homeAway: "away",
            score: awayScore,
            team: { displayName: "Argentina" },
          },
        ],
      },
    ],
  };
}
