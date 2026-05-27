import { beforeEach, describe, expect, it, vi } from "vitest";
import { savePredictionAction } from "@/actions/prediction-actions";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  matchFindUnique: vi.fn(),
  predictionUpsert: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth-guards", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/transactions", () => ({
  isTransactionConflict: () => false,
  runSerializableTransaction: <T,>(
    operation: (transaction: {
      match: { findUnique: typeof mocks.matchFindUnique };
      prediction: { upsert: typeof mocks.predictionUpsert };
    }) => Promise<T>,
  ) =>
    operation({
      match: { findUnique: mocks.matchFindUnique },
      prediction: { upsert: mocks.predictionUpsert },
    }),
}));

const matchId = "cmatch000000000000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user: { id: "current-user" } });
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`redirect:${url}`);
  });
  mocks.matchFindUnique.mockResolvedValue({
    id: matchId,
    startsAt: new Date("2099-06-11T19:00:00Z"),
    status: "SCHEDULED",
    participantsConfirmed: true,
    stage: "GROUP_STAGE",
    teamA: "Brasil",
    teamB: "Argentina",
  });
});

describe("savePredictionAction return destination", () => {
  it("returns inline edits to the personal predictions page", async () => {
    await expect(savePredictionAction(predictionForm("apostas"))).rejects.toThrow(
      "redirect:/apostas?success=prediction_saved",
    );

    expect(mocks.predictionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_matchId: { userId: "current-user", matchId } },
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/apostas");
  });

  it("does not accept an arbitrary return destination", async () => {
    await expect(savePredictionAction(predictionForm("https://example.com"))).rejects.toThrow(
      `redirect:/matches/${matchId}?success=prediction_saved`,
    );
  });

  it("keeps server-side edit restrictions when invoked from the personal page", async () => {
    mocks.matchFindUnique.mockResolvedValue({
      id: matchId,
      startsAt: new Date("2099-06-11T19:00:00Z"),
      status: "SCHEDULED",
      participantsConfirmed: false,
      stage: "ROUND_OF_16",
      teamA: "Brasil",
      teamB: "Argentina",
    });

    await expect(savePredictionAction(predictionForm("apostas"))).rejects.toThrow(
      "redirect:/apostas?error=participants_pending",
    );
    expect(mocks.predictionUpsert).not.toHaveBeenCalled();
  });
});

function predictionForm(returnTo: string) {
  const formData = new FormData();
  formData.set("matchId", matchId);
  formData.set("teamAScore", "2");
  formData.set("teamBScore", "1");
  formData.set("returnTo", returnTo);
  return formData;
}
