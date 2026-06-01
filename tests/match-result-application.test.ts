import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { applyMatchResult } from "@/lib/match-result-application";

const mocks = vi.hoisted(() => ({
  matchFindUnique: vi.fn(),
  matchUpdate: vi.fn(),
  recalculateMatchPredictions: vi.fn(),
  propagateFutureParticipants: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/match-results", () => ({
  recalculateMatchPredictions: mocks.recalculateMatchPredictions,
}));
vi.mock("@/lib/bracket-propagation", () => ({
  propagateFutureParticipants: mocks.propagateFutureParticipants,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.matchFindUnique.mockResolvedValue({
    id: "match",
    stage: "GROUP_STAGE",
    status: "SCHEDULED",
    teamA: "Brasil",
    teamB: "Argentina",
    participantsConfirmed: true,
  });
  mocks.matchUpdate.mockResolvedValue({ id: "match" });
  mocks.propagateFutureParticipants.mockResolvedValue({
    updatedMatches: 0,
    invalidatedPredictions: 0,
    blockedMatches: 0,
  });
});

describe("applyMatchResult", () => {
  it("updates scores without changing the per-match API lock", async () => {
    await applyMatchResult(transaction(), "match", {
      status: "STARTED",
      teamAScore: 1,
      teamBScore: 0,
      advancingTeam: null,
    });

    expect(mocks.matchUpdate).toHaveBeenCalledWith({
      where: { id: "match" },
      data: {
        status: "STARTED",
        teamAScore: 1,
        teamBScore: 0,
        advancingTeam: null,
      },
    });
  });
});

function transaction() {
  return {
    match: {
      findUnique: mocks.matchFindUnique,
      update: mocks.matchUpdate,
    },
  } as unknown as Prisma.TransactionClient;
}
