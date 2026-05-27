import { beforeEach, describe, expect, it, vi } from "vitest";
import { recalculateAllPointsAction } from "@/actions/admin-match-actions";

const transaction = {};

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  runSerializableTransaction: vi.fn(),
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
  mocks.runSerializableTransaction.mockImplementation((operation) => operation(transaction));
  mocks.recalculateAllMatchPredictions.mockResolvedValue(undefined);
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
    expect(mocks.recalculateAllMatchPredictions).toHaveBeenCalledWith(transaction);
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
