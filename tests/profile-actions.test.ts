import { beforeEach, describe, expect, it, vi } from "vitest";
import { updatePredictedChampionAction } from "@/actions/profile-actions";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  matchFindFirst: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth-guards", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/transactions", () => ({
  isTransactionConflict: () => false,
  runSerializableTransaction: <T,>(
    operation: (transaction: {
      match: { findFirst: typeof mocks.matchFindFirst };
      user: { update: typeof mocks.userUpdate };
    }) => Promise<T>,
  ) =>
    operation({
      match: { findFirst: mocks.matchFindFirst },
      user: { update: mocks.userUpdate },
    }),
}));

const user = { id: "cuser123" };
const editableOpeningMatch = {
  status: "SCHEDULED",
  startsAt: new Date("2099-06-11T19:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ user });
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`redirect:${url}`);
  });
});

describe("updatePredictedChampionAction", () => {
  it("saves a scheduled tournament team before the opening match", async () => {
    mocks.matchFindFirst
      .mockResolvedValueOnce(editableOpeningMatch)
      .mockResolvedValueOnce({ id: "group-match" });

    await expect(updatePredictedChampionAction(formData("Brasil"))).rejects.toThrow(
      "redirect:/me?success=predicted_champion_updated",
    );

    expect(mocks.matchFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          stage: "GROUP_STAGE",
          OR: [{ teamA: "Brasil" }, { teamB: "Brasil" }],
        }),
      }),
    );
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { predictedChampion: "Brasil" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/me");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/apostas");
  });

  it("returns champion prediction updates to the personal predictions page", async () => {
    mocks.matchFindFirst
      .mockResolvedValueOnce(editableOpeningMatch)
      .mockResolvedValueOnce({ id: "group-match" });

    await expect(
      updatePredictedChampionAction(formData("Brasil", "apostas")),
    ).rejects.toThrow("redirect:/apostas?success=predicted_champion_updated");

    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { predictedChampion: "Brasil" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/me");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/apostas");
  });

  it("rejects a team outside the tournament schedule", async () => {
    mocks.matchFindFirst
      .mockResolvedValueOnce(editableOpeningMatch)
      .mockResolvedValueOnce(null);

    await expect(updatePredictedChampionAction(formData("Inexistente"))).rejects.toThrow(
      "redirect:/me?error=invalid_predicted_champion",
    );
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("returns validation errors to the selected page without trusting arbitrary paths", async () => {
    await expect(
      updatePredictedChampionAction(formData("A".repeat(81), "apostas")),
    ).rejects.toThrow("redirect:/apostas?error=invalid_predicted_champion");

    await expect(
      updatePredictedChampionAction(formData("A".repeat(81), "https://example.com")),
    ).rejects.toThrow("redirect:/me?error=invalid_predicted_champion");

    expect(mocks.matchFindFirst).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("allows clearing an optional selection only before the deadline", async () => {
    mocks.matchFindFirst.mockResolvedValueOnce(editableOpeningMatch);

    await expect(updatePredictedChampionAction(formData(""))).rejects.toThrow(
      "redirect:/me?success=predicted_champion_updated",
    );
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { predictedChampion: null },
    });

    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ user });
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
    mocks.matchFindFirst.mockResolvedValueOnce({
      ...editableOpeningMatch,
      status: "STARTED",
    });

    await expect(updatePredictedChampionAction(formData(""))).rejects.toThrow(
      "redirect:/me?error=champion_prediction_closed",
    );
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });
});

function formData(predictedChampion: string, returnTo?: string) {
  const data = new FormData();
  data.set("predictedChampion", predictedChampion);
  if (returnTo) {
    data.set("returnTo", returnTo);
  }
  return data;
}
