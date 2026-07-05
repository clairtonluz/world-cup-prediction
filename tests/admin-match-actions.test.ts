import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  recalculateAllPointsAction,
  updateMatchAction,
} from "@/actions/admin-match-actions";

const matchId = "cmatch000000000000000000001";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  runSerializableTransaction: vi.fn(),
  matchFindUnique: vi.fn(),
  matchUpdate: vi.fn(),
  recalculateAllMatchPredictions: vi.fn(),
  recalculateMatchPredictions: vi.fn(),
  propagateFutureParticipants: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth-guards", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/bracket-propagation", () => ({
  propagateFutureParticipants: mocks.propagateFutureParticipants,
}));
vi.mock("@/lib/match-results", () => ({
  recalculateAllMatchPredictions: mocks.recalculateAllMatchPredictions,
  recalculateMatchPredictions: mocks.recalculateMatchPredictions,
}));
vi.mock("@/lib/transactions", () => ({
  isTransactionConflict: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034",
  runSerializableTransaction: mocks.runSerializableTransaction,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ user: { id: "admin" } });
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`redirect:${url}`);
  });
  mocks.runSerializableTransaction.mockImplementation((operation) =>
    operation({
      match: {
        findUnique: mocks.matchFindUnique,
        update: mocks.matchUpdate,
      },
    }),
  );
  mocks.matchFindUnique.mockResolvedValue(match());
  mocks.matchUpdate.mockResolvedValue(match());
  mocks.recalculateAllMatchPredictions.mockResolvedValue(undefined);
  mocks.recalculateMatchPredictions.mockResolvedValue(undefined);
  mocks.propagateFutureParticipants.mockResolvedValue(null);
});

describe("recalculateAllPointsAction", () => {
  it("requires the admin guard before recalculating points", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("forbidden"));

    await expect(recalculateAllPointsAction()).rejects.toThrow("forbidden");

    expect(mocks.runSerializableTransaction).not.toHaveBeenCalled();
    expect(mocks.recalculateAllMatchPredictions).not.toHaveBeenCalled();
  });

  it("recalculates all points and revalidates affected pages", async () => {
    await expect(recalculateAllPointsAction()).rejects.toThrow(
      "redirect:/admin/matches?success=points_recalculated",
    );

    expect(mocks.runSerializableTransaction).toHaveBeenCalledWith(
      mocks.recalculateAllMatchPredictions,
    );
    expect(mocks.recalculateAllMatchPredictions).toHaveBeenCalledWith({
      match: {
        findUnique: mocks.matchFindUnique,
        update: mocks.matchUpdate,
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/matches");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/admin/matches/[id]/edit",
      "page",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/matches");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/matches/[id]", "page");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/apostas");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/grupos");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/grupos-de-amigos");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/grupos-de-amigos/[id]",
      "page",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ranking");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/me");
  });

  it("redirects with conflict feedback when the transaction cannot be serialized", async () => {
    mocks.runSerializableTransaction.mockRejectedValue({ code: "P2034" });

    await expect(recalculateAllPointsAction()).rejects.toThrow(
      "redirect:/admin/matches?error=update_conflict",
    );

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateMatchAction", () => {
  it("requires the admin guard before updating a match", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("forbidden"));

    await expect(updateMatchAction(matchId, matchForm())).rejects.toThrow(
      "forbidden",
    );

    expect(mocks.runSerializableTransaction).not.toHaveBeenCalled();
    expect(mocks.matchUpdate).not.toHaveBeenCalled();
  });

  it("redirects with validation feedback when the start datetime is invalid", async () => {
    await expect(
      updateMatchAction(matchId, matchForm({ startsAt: "not-a-date" })),
    ).rejects.toThrow(`redirect:/admin/matches/${matchId}/edit?error=invalid_match_start`);

    expect(mocks.runSerializableTransaction).not.toHaveBeenCalled();
    expect(mocks.matchUpdate).not.toHaveBeenCalled();
  });

  it("updates the start datetime for a scheduled match", async () => {
    const startsAt = "2026-06-11T20:30:00.000Z";

    await expect(
      updateMatchAction(matchId, matchForm({ startsAt })),
    ).rejects.toThrow(`redirect:/admin/matches/${matchId}/edit?success=match_updated`);

    expect(mocks.matchUpdate).toHaveBeenCalledWith({
      where: { id: matchId },
      data: expect.objectContaining({
        startsAt: new Date(startsAt),
        status: "SCHEDULED",
      }),
    });
    expect(mocks.recalculateMatchPredictions).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/matches");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/matches/${matchId}`);
  });

  it("updates the start datetime for a started match without reopening predictions", async () => {
    const startsAt = "2026-06-11T20:30:00.000Z";
    mocks.matchFindUnique.mockResolvedValue(match({ status: "STARTED" }));

    await expect(
      updateMatchAction(
        matchId,
        matchForm({ status: "STARTED", startsAt, teamAScore: "1", teamBScore: "0" }),
      ),
    ).rejects.toThrow(`redirect:/admin/matches/${matchId}/edit?success=match_updated`);

    expect(mocks.matchUpdate).toHaveBeenCalledWith({
      where: { id: matchId },
      data: expect.objectContaining({
        startsAt: new Date(startsAt),
        status: "STARTED",
      }),
    });
  });

  it("rejects start datetime changes after a match is finished", async () => {
    mocks.matchFindUnique.mockResolvedValue(
      match({
        status: "FINISHED",
        teamAScore: 2,
        teamBScore: 1,
      }),
    );

    await expect(
      updateMatchAction(
        matchId,
        matchForm({
          status: "FINISHED",
          startsAt: "2026-06-11T20:30:00.000Z",
          teamAScore: "2",
          teamBScore: "1",
        }),
      ),
    ).rejects.toThrow(`redirect:/admin/matches/${matchId}/edit?error=finished_match_locked`);

    expect(mocks.matchUpdate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("redirects with conflict feedback when the match update conflicts", async () => {
    mocks.runSerializableTransaction.mockRejectedValue({ code: "P2034" });

    await expect(updateMatchAction(matchId, matchForm())).rejects.toThrow(
      `redirect:/admin/matches/${matchId}/edit?error=update_conflict`,
    );

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

function match(overrides = {}) {
  return {
    id: matchId,
    matchNumber: 1,
    fifaMatchId: "fifa-match",
    espnEventId: null,
    scoreSyncLocked: false,
    teamA: "Brasil",
    teamB: "Argentina",
    teamASlot: null,
    teamBSlot: null,
    participantsConfirmed: true,
    stage: "GROUP_STAGE",
    groupCode: null,
    groupRound: null,
    startsAt: new Date("2026-06-11T19:00:00.000Z"),
    venue: "Estadio",
    hostCity: "Cidade",
    status: "SCHEDULED",
    teamAScore: null,
    teamBScore: null,
    advancingTeam: null,
    predictionsResetAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function matchForm({
  status = "SCHEDULED",
  startsAt = "2026-06-11T19:00:00.000Z",
  teamAScore = "",
  teamBScore = "",
  advancingTeam = "",
} = {}) {
  const formData = new FormData();
  formData.set("status", status);
  formData.set("startsAt", startsAt);
  formData.set("teamAScore", teamAScore);
  formData.set("teamBScore", teamBScore);
  formData.set("advancingTeam", advancingTeam);
  return formData;
}
