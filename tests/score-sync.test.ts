import { beforeEach, describe, expect, it, vi } from "vitest";
import { runAutomaticScoreSync } from "@/lib/score-sync/sync";

const mocks = vi.hoisted(() => ({
  settingsUpsert: vi.fn(),
  matchFindMany: vi.fn(),
  fetchEspnScoreboard: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    scoreSyncSettings: { upsert: mocks.settingsUpsert },
    match: { findMany: mocks.matchFindMany },
  }),
}));
vi.mock("@/lib/score-sync/client", () => ({
  EspnScoreboardRequestError: class EspnScoreboardRequestError extends Error {},
  fetchEspnScoreboard: mocks.fetchEspnScoreboard,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.settingsUpsert.mockResolvedValue({
    id: "default",
    enabled: true,
    intervalMinutes: 10,
    lastSyncFinishedAt: null,
  });
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
});
