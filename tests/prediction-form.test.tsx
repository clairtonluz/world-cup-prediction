// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InlinePredictionActionState } from "@/actions/prediction-actions";
import { PredictionForm } from "@/components/matches/prediction-form";

const mocks = vi.hoisted(() => ({
  saveInlinePredictionAction: vi.fn(),
  savePredictionAction: vi.fn(),
}));

vi.mock("@/actions/prediction-actions", () => ({
  saveInlinePredictionAction: mocks.saveInlinePredictionAction,
  savePredictionAction: mocks.savePredictionAction,
}));

const visibleClientRects = {
  length: 1,
  item: () => null,
  [Symbol.iterator]: function* iterator() {},
} as DOMRectList;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(Element.prototype, "getClientRects").mockReturnValue(
    visibleClientRects,
  );
  mocks.saveInlinePredictionAction.mockReset();
  mocks.savePredictionAction.mockReset();
});

describe("PredictionForm inline autosave", () => {
  it("keeps the submitted draft visible and advances focus only after save succeeds", async () => {
    const user = userEvent.setup();
    const saveResult = deferred<InlinePredictionActionState>();
    let submittedFormData: FormData | null = null;
    mocks.saveInlinePredictionAction.mockImplementation(
      async (_previousState: InlinePredictionActionState, formData: FormData) => {
        submittedFormData = formData;
        return saveResult.promise;
      },
    );

    renderInlinePredictionForms();

    const teamAScoreInput = scoreInput("Palpite de Brasil");
    const teamBScoreInput = scoreInput("Palpite de Argentina");
    const nextMatchScoreInput = scoreInput("Palpite de Espanha");

    await user.type(teamAScoreInput, "0");
    expect(document.activeElement).toBe(teamBScoreInput);

    await user.type(teamBScoreInput, "1");

    await waitFor(() =>
      expect(mocks.saveInlinePredictionAction).toHaveBeenCalledTimes(1),
    );
    expect(submittedFormData?.get("teamAScore")).toBe("0");
    expect(submittedFormData?.get("teamBScore")).toBe("1");
    expect(teamAScoreInput.value).toBe("0");
    expect(teamBScoreInput.value).toBe("1");
    expect(teamAScoreInput.readOnly).toBe(true);
    expect(teamBScoreInput.readOnly).toBe(true);
    expect(saveButton("Salvando...").disabled).toBe(true);
    expect(document.activeElement).toBe(teamBScoreInput);

    saveResult.resolve({
      status: "success",
      message: "Aposta salva.",
      submittedAt: 1,
      prediction: {
        teamAScore: "0",
        teamBScore: "1",
        predictedAdvancingTeam: "",
      },
    });

    await waitFor(() => expect(document.activeElement).toBe(nextMatchScoreInput));
    expect(teamAScoreInput.value).toBe("0");
    expect(teamBScoreInput.value).toBe("1");
  });

  it("keeps the draft in place and does not advance focus after save errors", async () => {
    const user = userEvent.setup();
    const saveResult = deferred<InlinePredictionActionState>();
    mocks.saveInlinePredictionAction.mockImplementation(
      async () => saveResult.promise,
    );

    renderInlinePredictionForms();

    const teamAScoreInput = scoreInput("Palpite de Brasil");
    const teamBScoreInput = scoreInput("Palpite de Argentina");
    const nextMatchScoreInput = scoreInput("Palpite de Espanha");

    await user.type(teamAScoreInput, "0");
    await user.type(teamBScoreInput, "1");
    await waitFor(() =>
      expect(mocks.saveInlinePredictionAction).toHaveBeenCalledTimes(1),
    );

    saveResult.resolve({
      status: "error",
      message: "Não foi possível salvar.",
      submittedAt: 1,
    });

    await waitFor(() =>
      expect(screen.getByTitle("Não foi possível salvar.")).toBeDefined(),
    );
    expect(teamAScoreInput.value).toBe("0");
    expect(teamBScoreInput.value).toBe("1");
    expect(document.activeElement).not.toBe(nextMatchScoreInput);
  });
});

function renderInlinePredictionForms() {
  return render(
    <>
      <PredictionForm
        matchId="cmatch000000000000000000001"
        teamA="Brasil"
        teamB="Argentina"
        stage="GROUP_STAGE"
        disabled={false}
        returnTo="matches"
        fieldIdPrefix="first-match"
        variant="inline"
        inlineLayout="scoreOnly"
      />
      <PredictionForm
        matchId="cmatch000000000000000000002"
        teamA="Espanha"
        teamB="França"
        stage="GROUP_STAGE"
        disabled={false}
        returnTo="matches"
        fieldIdPrefix="second-match"
        variant="inline"
        inlineLayout="scoreOnly"
      />
    </>,
  );
}

function scoreInput(name: string) {
  return screen.getByLabelText(name) as HTMLInputElement;
}

function saveButton(name: string) {
  return screen.getByRole("button", { name }) as HTMLButtonElement;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}
