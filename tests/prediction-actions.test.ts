import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  saveInlinePredictionAction,
  savePredictionAction,
  type InlinePredictionActionState,
} from "@/actions/prediction-actions";

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
  it("returns inline edits to the matches page", async () => {
    await expect(savePredictionAction(predictionForm("matches"))).rejects.toThrow(
      "redirect:/matches?success=prediction_saved",
    );

    expect(mocks.predictionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_matchId: { userId: "current-user", matchId } },
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/matches");
  });

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

describe("savePredictionAction knockout advancing team", () => {
  beforeEach(() => {
    mocks.matchFindUnique.mockResolvedValue({
      id: matchId,
      startsAt: new Date("2099-06-11T19:00:00Z"),
      status: "SCHEDULED",
      participantsConfirmed: true,
      stage: "ROUND_OF_16",
      teamA: "Brasil",
      teamB: "Argentina",
    });
  });

  it("saves the predicted winner as the advancing team for non-draw scores", async () => {
    await expect(
      savePredictionAction(
        predictionForm("match", {
          teamAScore: "2",
          teamBScore: "1",
        }),
      ),
    ).rejects.toThrow(`redirect:/matches/${matchId}?success=prediction_saved`);

    expect(mocks.predictionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          predictedAdvancingTeam: "Brasil",
        }),
        update: expect.objectContaining({
          predictedAdvancingTeam: "Brasil",
        }),
      }),
    );
  });

  it("rejects a tied knockout score without an advancing team", async () => {
    await expect(
      savePredictionAction(
        predictionForm("match", {
          teamAScore: "1",
          teamBScore: "1",
        }),
      ),
    ).rejects.toThrow(
      `redirect:/matches/${matchId}?error=invalid_advancing_team_prediction`,
    );

    expect(mocks.predictionUpsert).not.toHaveBeenCalled();
  });

  it("saves a valid advancing team for tied knockout scores", async () => {
    await expect(
      savePredictionAction(
        predictionForm("match", {
          teamAScore: "1",
          teamBScore: "1",
          predictedAdvancingTeam: "Argentina",
        }),
      ),
    ).rejects.toThrow(`redirect:/matches/${matchId}?success=prediction_saved`);

    expect(mocks.predictionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          predictedAdvancingTeam: "Argentina",
        }),
        update: expect.objectContaining({
          predictedAdvancingTeam: "Argentina",
        }),
      }),
    );
  });
});

describe("saveInlinePredictionAction", () => {
  it("returns local success feedback without redirecting", async () => {
    await expect(
      saveInlinePredictionAction(inlineState(), predictionForm("matches")),
    ).resolves.toMatchObject({
      status: "success",
      message: "Aposta salva.",
      prediction: {
        teamAScore: "2",
        teamBScore: "1",
        predictedAdvancingTeam: "",
      },
    });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.predictionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_matchId: { userId: "current-user", matchId } },
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/matches");
  });

  it("returns local validation failure without saving", async () => {
    await expect(
      saveInlinePredictionAction(
        inlineState(),
        predictionForm("matches", { teamAScore: "" }),
      ),
    ).resolves.toMatchObject({
      status: "error",
      message: "Informe placares válidos entre 0 e 99.",
    });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.predictionUpsert).not.toHaveBeenCalled();
  });

  it("keeps server-side edit restrictions without saving", async () => {
    mocks.matchFindUnique.mockResolvedValue({
      id: matchId,
      startsAt: new Date("2099-06-11T19:00:00Z"),
      status: "SCHEDULED",
      participantsConfirmed: false,
      stage: "ROUND_OF_16",
      teamA: "Brasil",
      teamB: "Argentina",
    });

    await expect(
      saveInlinePredictionAction(inlineState(), predictionForm("matches")),
    ).resolves.toMatchObject({
      status: "error",
      message: "A aposta será liberada quando as duas equipes estiverem confirmadas.",
    });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.predictionUpsert).not.toHaveBeenCalled();
  });
});

function predictionForm(
  returnTo: string,
  {
    teamAScore = "2",
    teamBScore = "1",
    predictedAdvancingTeam,
  }: {
    teamAScore?: string;
    teamBScore?: string;
    predictedAdvancingTeam?: string;
  } = {},
) {
  const formData = new FormData();
  formData.set("matchId", matchId);
  formData.set("teamAScore", teamAScore);
  formData.set("teamBScore", teamBScore);
  formData.set("returnTo", returnTo);
  if (predictedAdvancingTeam) {
    formData.set("predictedAdvancingTeam", predictedAdvancingTeam);
  }
  return formData;
}

function inlineState(): InlinePredictionActionState {
  return {
    status: "idle",
    message: "",
    submittedAt: 0,
  };
}
