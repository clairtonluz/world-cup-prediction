"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  saveInlinePredictionAction,
  savePredictionAction,
  type InlinePredictionActionState,
} from "@/actions/prediction-actions";
import { TeamLabel } from "@/components/shared/team-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MatchStageValue } from "@/lib/constants";
import { teamText } from "@/lib/display";
import { requiresAdvancingTeamPrediction } from "@/lib/tournament-predictions";
import { CircleCheck, CircleX } from "lucide-react";

type PredictionFormVariant = "default" | "inline";
type PredictionInlineLayout = "withTeamLabels" | "scoreOnly";
type PredictionReturnDestination = "match" | "matches" | "apostas";
type PredictionFormValues = {
  teamAScore: string;
  teamBScore: string;
  predictedAdvancingTeam: string;
};

const INITIAL_INLINE_ACTION_STATE: InlinePredictionActionState = {
  status: "idle",
  message: "",
  submittedAt: 0,
};
const PREDICTION_SCORE_INPUT_SELECTOR =
  'input[data-prediction-score-input="true"]';

export function PredictionForm({
  matchId,
  teamA,
  teamB,
  stage,
  teamASlot,
  teamBSlot,
  prediction,
  disabled,
  disabledReason,
  returnTo = "match",
  fieldIdPrefix,
  variant = "default",
  inlineLayout = "withTeamLabels",
}: {
  matchId: string;
  teamA: string | null;
  teamB: string | null;
  stage: MatchStageValue;
  teamASlot?: string | null;
  teamBSlot?: string | null;
  prediction?: {
    teamAScore: number;
    teamBScore: number;
    predictedAdvancingTeam: string | null;
  };
  disabled: boolean;
  disabledReason?: string;
  returnTo?: PredictionReturnDestination;
  fieldIdPrefix?: string;
  variant?: PredictionFormVariant;
  inlineLayout?: PredictionInlineLayout;
}) {
  const isInline = variant === "inline";
  const isScoreOnlyInline = isInline && inlineLayout === "scoreOnly";
  const formRef = useRef<HTMLFormElement>(null);
  const advancingTeamSelectRef = useRef<HTMLSelectElement>(null);
  const autoAdvanceInputRef = useRef<HTMLInputElement | null>(null);
  const handledAutoAdvanceRequestRef = useRef(0);
  const initialPrediction = predictionFormValues(prediction);
  const [inlineActionState, inlineFormAction, inlinePending] = useActionState(
    saveInlinePredictionAction,
    { ...INITIAL_INLINE_ACTION_STATE, prediction: initialPrediction },
  );
  const savedPrediction = inlineActionState.prediction ?? initialPrediction;
  const [teamAScore, setTeamAScore] = useState(initialPrediction.teamAScore);
  const [teamBScore, setTeamBScore] = useState(initialPrediction.teamBScore);
  const [autoAdvanceRequestId, setAutoAdvanceRequestId] = useState(0);
  const [selectedAdvancingTeam, setSelectedAdvancingTeam] =
    useState(initialPrediction.predictedAdvancingTeam);
  const [hiddenFeedbackSubmittedAt, setHiddenFeedbackSubmittedAt] = useState(0);
  const draftPredictionRef = useRef(initialPrediction);
  const submittedInlineDraftRef = useRef<PredictionFormValues | null>(null);
  const requestsAdvancingTeam = requiresAdvancingTeamPrediction(stage);
  const teamAScoreId = fieldIdPrefix ? `${fieldIdPrefix}-teamAScore` : "teamAScore";
  const teamBScoreId = fieldIdPrefix ? `${fieldIdPrefix}-teamBScore` : "teamBScore";
  const advancingTeamId = fieldIdPrefix
    ? `${fieldIdPrefix}-predictedAdvancingTeam`
    : "predictedAdvancingTeam";
  const teamAScoreNumber = scoreFromField(teamAScore);
  const teamBScoreNumber = scoreFromField(teamBScore);
  const hasCompleteScores =
    teamAScoreNumber !== null && teamBScoreNumber !== null;
  const isDrawPrediction =
    hasCompleteScores && teamAScoreNumber === teamBScoreNumber;
  const inferredAdvancingTeam =
    hasCompleteScores && !isDrawPrediction
      ? teamAScoreNumber > teamBScoreNumber
        ? teamA
        : teamB
      : null;
  const displayedAdvancingTeam =
    inferredAdvancingTeam ?? selectedAdvancingTeam;
  const submittedAdvancingTeam = requestsAdvancingTeam
    ? isDrawPrediction
      ? selectedAdvancingTeam
      : inferredAdvancingTeam ?? ""
    : "";
  const canAutoSubmitPrediction =
    hasCompleteScores &&
    (!requestsAdvancingTeam || submittedAdvancingTeam !== "");
  const initialSubmittedAdvancingTeam = requestsAdvancingTeam
    ? savedPrediction.predictedAdvancingTeam
    : "";
  const hasPredictionChanged =
    teamAScore !== savedPrediction.teamAScore ||
    teamBScore !== savedPrediction.teamBScore ||
    submittedAdvancingTeam !== initialSubmittedAdvancingTeam;
  const showActions = !isInline || hasPredictionChanged || inlinePending;
  const showInlineFeedback =
    isInline &&
    inlineActionState.status !== "idle" &&
    inlineActionState.submittedAt > 0 &&
    inlineActionState.submittedAt !== hiddenFeedbackSubmittedAt;
  const hasSavedPrediction =
    savedPrediction.teamAScore !== "" && savedPrediction.teamBScore !== "";
  const submitLabel = isInline
    ? hasSavedPrediction
      ? "Salvar alteração"
      : "Salvar aposta"
    : prediction
      ? "Atualizar aposta"
      : "Salvar aposta";
  const advancingTeamHelp = !hasCompleteScores
    ? "Informe o placar para definir como a equipe classificada será registrada."
    : isDrawPrediction
      ? "Em caso de empate no placar previsto, informe quem avança."
      : "O placar previsto define automaticamente quem avança.";
  const teamAScoreLabel = `Palpite de ${teamText(teamA, teamASlot ?? null)}`;
  const teamBScoreLabel = `Palpite de ${teamText(teamB, teamBSlot ?? null)}`;
  const preventInlineEditing = isInline && inlinePending;

  const restorePredictionInputValues = useCallback(
    (nextPrediction: PredictionFormValues) => {
      const form = formRef.current;
      if (!form) {
        return;
      }

      const teamAScoreInput = form.elements.namedItem("teamAScore");
      const teamBScoreInput = form.elements.namedItem("teamBScore");
      const advancingTeamSelect = form.elements.namedItem(
        "predictedAdvancingTeam",
      );

      if (teamAScoreInput instanceof HTMLInputElement) {
        teamAScoreInput.value = nextPrediction.teamAScore;
      }
      if (teamBScoreInput instanceof HTMLInputElement) {
        teamBScoreInput.value = nextPrediction.teamBScore;
      }
      if (advancingTeamSelect instanceof HTMLSelectElement) {
        advancingTeamSelect.value = nextPrediction.predictedAdvancingTeam;
      }
    },
    [],
  );

  const currentSubmittedInlineDraft = useCallback(
    () => submittedInlineDraftRef.current ?? draftPredictionRef.current,
    [],
  );

  useEffect(() => {
    if (
      !isInline ||
      inlineActionState.status === "idle" ||
      inlineActionState.submittedAt === 0
    ) {
      return;
    }

    let draftRestoreTimeoutId: number | undefined;
    const autoAdvanceInput = autoAdvanceInputRef.current;
    autoAdvanceInputRef.current = null;

    if (inlineActionState.status === "success" && inlineActionState.prediction) {
      submittedInlineDraftRef.current = null;
      draftPredictionRef.current = inlineActionState.prediction;
      restorePredictionInputValues(inlineActionState.prediction);
    } else if (inlineActionState.status === "error") {
      const submittedDraft = currentSubmittedInlineDraft();
      draftPredictionRef.current = submittedDraft;
      restorePredictionInputValues(submittedDraft);
      draftRestoreTimeoutId = window.setTimeout(() => {
        restorePredictionInputValues(submittedDraft);
      }, 0);
    }

    if (autoAdvanceInput && inlineActionState.status === "success") {
      focusNextPredictionScoreInput(autoAdvanceInput);
    } else {
      formRef.current?.focus({ preventScroll: true });
    }

    const timeoutId = window.setTimeout(() => {
      setHiddenFeedbackSubmittedAt((currentSubmittedAt) =>
        currentSubmittedAt === inlineActionState.submittedAt
          ? currentSubmittedAt
          : inlineActionState.submittedAt,
      );
    }, 2500);

    return () => {
      if (draftRestoreTimeoutId !== undefined) {
        window.clearTimeout(draftRestoreTimeoutId);
      }
      window.clearTimeout(timeoutId);
    };
  }, [
    currentSubmittedInlineDraft,
    inlineActionState,
    isInline,
    restorePredictionInputValues,
  ]);

  useEffect(() => {
    if (
      !isInline ||
      autoAdvanceRequestId === 0 ||
      handledAutoAdvanceRequestRef.current === autoAdvanceRequestId ||
      inlinePending
    ) {
      return;
    }

    if (!canAutoSubmitPrediction) {
      if (hasCompleteScores && requestsAdvancingTeam) {
        advancingTeamSelectRef.current?.focus();
      }
      return;
    }

    handledAutoAdvanceRequestRef.current = autoAdvanceRequestId;
    const autoAdvanceInput = autoAdvanceInputRef.current;
    if (!autoAdvanceInput) {
      return;
    }

    if (!hasPredictionChanged) {
      autoAdvanceInputRef.current = null;
      focusNextPredictionScoreInput(autoAdvanceInput);
      return;
    }

    submittedInlineDraftRef.current = { ...draftPredictionRef.current };
    formRef.current?.requestSubmit();
  }, [
    autoAdvanceRequestId,
    canAutoSubmitPrediction,
    hasCompleteScores,
    hasPredictionChanged,
    inlinePending,
    isInline,
    requestsAdvancingTeam,
  ]);

  function applyDraftPrediction(nextPrediction: PredictionFormValues) {
    draftPredictionRef.current = nextPrediction;
    setTeamAScore(nextPrediction.teamAScore);
    setTeamBScore(nextPrediction.teamBScore);
    setSelectedAdvancingTeam(nextPrediction.predictedAdvancingTeam);
    restorePredictionInputValues(nextPrediction);
  }

  function resetPrediction() {
    applyDraftPrediction(savedPrediction);
  }

  function preventUnchangedInlineSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isInline) {
      return;
    }

    if (!hasPredictionChanged) {
      event.preventDefault();
      return;
    }

    submittedInlineDraftRef.current = { ...draftPredictionRef.current };
  }

  function preserveInlineDraftAfterFormReset(event: FormEvent<HTMLFormElement>) {
    if (!isInline) {
      return;
    }

    event.preventDefault();
    applyDraftPrediction(currentSubmittedInlineDraft());
  }

  function handleTeamAScoreChange(event: ChangeEvent<HTMLInputElement>) {
    if (preventInlineEditing) {
      return;
    }

    const score = event.currentTarget.value;
    updateDraftPrediction({ teamAScore: score });
    setTeamAScore(score);

    if (scoreFromField(score) !== null) {
      focusNextPredictionScoreInput(event.currentTarget);
    }
  }

  function handleTeamBScoreChange(event: ChangeEvent<HTMLInputElement>) {
    if (preventInlineEditing) {
      return;
    }

    const score = event.currentTarget.value;
    const draftPrediction = updateDraftPrediction({ teamBScore: score });
    setTeamBScore(score);

    if (
      scoreFromField(draftPrediction.teamAScore) === null ||
      scoreFromField(score) === null
    ) {
      return;
    }

    if (isInline) {
      autoAdvanceInputRef.current = event.currentTarget;
      setAutoAdvanceRequestId((requestId) => requestId + 1);
    }
  }

  function handleAdvancingTeamChange(event: ChangeEvent<HTMLSelectElement>) {
    if (preventInlineEditing) {
      return;
    }

    const predictedAdvancingTeam = event.target.value;
    updateDraftPrediction({ predictedAdvancingTeam });
    setSelectedAdvancingTeam(predictedAdvancingTeam);
  }

  function updateDraftPrediction(nextValues: Partial<PredictionFormValues>) {
    const nextPrediction = {
      ...draftPredictionRef.current,
      ...nextValues,
    };
    draftPredictionRef.current = nextPrediction;
    return nextPrediction;
  }

  if (disabled) {
    return (
      <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
        {disabledReason ?? "As apostas estão encerradas porque o jogo já começou."}
      </p>
    );
  }

  const scoreGridClassName = isScoreOnlyInline
    ? "grid w-full grid-cols-[4rem_auto_4rem] items-center gap-1"
    : isInline
      ? "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2"
      : "grid grid-cols-[1fr_auto_1fr] items-end gap-3";
  const teamAScoreFieldClassName = isScoreOnlyInline
    ? "min-w-0"
    : isInline
      ? "min-w-0 space-y-1 text-right"
      : undefined;
  const teamBScoreFieldClassName = isScoreOnlyInline
    ? "min-w-0"
    : isInline
      ? "min-w-0 space-y-1"
      : undefined;
  const teamAScoreInputClassName = isScoreOnlyInline
    ? "h-8 w-16 px-2 text-center"
    : isInline
      ? "ml-auto w-20 text-center sm:w-[5.5rem]"
      : undefined;
  const teamBScoreInputClassName = isScoreOnlyInline
    ? "h-8 w-16 px-2 text-center"
    : isInline
      ? "mr-auto w-20 text-center sm:w-[5.5rem]"
      : undefined;
  const scoreSeparatorClassName = isScoreOnlyInline
    ? "text-center text-xs text-slate-400"
    : "pb-3 text-center text-slate-500";
  const formClassName = isScoreOnlyInline
    ? "w-full space-y-2"
    : isInline
      ? "space-y-3"
      : "space-y-4";
  const actionsClassName = isScoreOnlyInline
    ? "flex flex-wrap items-center justify-center gap-2"
    : "flex flex-wrap items-center gap-2";

  return (
    <form
      ref={formRef}
      action={isInline ? inlineFormAction : savePredictionAction}
      aria-label={isInline ? "Aposta do jogo" : undefined}
      className={formClassName}
      onSubmit={preventUnchangedInlineSubmit}
      onReset={preserveInlineDraftAfterFormReset}
      aria-busy={isInline ? inlinePending : undefined}
      tabIndex={isInline ? -1 : undefined}
    >
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className={scoreGridClassName}>
        <div className={teamAScoreFieldClassName}>
          <Label
            htmlFor={teamAScoreId}
            className={isScoreOnlyInline ? "sr-only" : undefined}
          >
            {isScoreOnlyInline ? (
              teamAScoreLabel
            ) : (
              <TeamLabel
                team={teamA}
                slot={teamASlot}
                className={isInline ? "w-full max-w-full justify-end" : undefined}
                textClassName={isInline ? "min-w-0 break-words text-right" : undefined}
              />
            )}
          </Label>
          <Input
            id={teamAScoreId}
            name="teamAScore"
            type="number"
            min={0}
            max={99}
            value={teamAScore}
            onChange={handleTeamAScoreChange}
            className={teamAScoreInputClassName}
            data-prediction-score-input="true"
            readOnly={preventInlineEditing}
            required
          />
        </div>
        <span className={scoreSeparatorClassName}>x</span>
        <div className={teamBScoreFieldClassName}>
          <Label
            htmlFor={teamBScoreId}
            className={isScoreOnlyInline ? "sr-only" : undefined}
          >
            {isScoreOnlyInline ? (
              teamBScoreLabel
            ) : (
              <TeamLabel
                team={teamB}
                slot={teamBSlot}
                className={isInline ? "w-full max-w-full" : undefined}
                textClassName={isInline ? "min-w-0 break-words" : undefined}
              />
            )}
          </Label>
          <Input
            id={teamBScoreId}
            name="teamBScore"
            type="number"
            min={0}
            max={99}
            value={teamBScore}
            onChange={handleTeamBScoreChange}
            className={teamBScoreInputClassName}
            data-prediction-score-input="true"
            readOnly={preventInlineEditing}
            required
          />
        </div>
      </div>
      {requestsAdvancingTeam ? (
        <div className={isScoreOnlyInline ? "text-left" : undefined}>
          <Label htmlFor={advancingTeamId}>Equipe classificada</Label>
          {!isDrawPrediction && inferredAdvancingTeam ? (
            <input
              type="hidden"
              name="predictedAdvancingTeam"
              value={inferredAdvancingTeam}
            />
          ) : null}
          <select
            ref={advancingTeamSelectRef}
            id={advancingTeamId}
            name={isDrawPrediction ? "predictedAdvancingTeam" : undefined}
            value={displayedAdvancingTeam}
            onChange={handleAdvancingTeamChange}
            required={isDrawPrediction}
            disabled={!isDrawPrediction || preventInlineEditing}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#0e74e1] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="" disabled>
              {hasCompleteScores ? "Selecione quem avança" : "Aguardando placar"}
            </option>
            {teamA ? <option value={teamA}>{teamA}</option> : null}
            {teamB ? <option value={teamB}>{teamB}</option> : null}
          </select>
          <p className="mt-1 text-sm text-slate-600">
            {advancingTeamHelp}
          </p>
        </div>
      ) : null}
      {showActions || showInlineFeedback ? (
        <div className={actionsClassName}>
          {showActions ? (
            <>
              <Button
                type="submit"
                size={isInline ? "sm" : "default"}
                disabled={isInline && inlinePending}
              >
                {inlinePending ? "Salvando..." : submitLabel}
              </Button>
              {isInline ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetPrediction}
                  disabled={inlinePending}
                >
                  Cancelar
                </Button>
              ) : null}
            </>
          ) : null}
          {showInlineFeedback ? (
            <InlinePredictionFeedback state={inlineActionState} />
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function InlinePredictionFeedback({
  state,
}: {
  state: InlinePredictionActionState;
}) {
  const iconClassName =
    state.status === "success" ? "text-emerald-700" : "text-red-700";
  const Icon = state.status === "success" ? CircleCheck : CircleX;

  return (
    <span
      aria-live="polite"
      className={`inline-flex h-9 items-center ${iconClassName}`}
      title={state.message}
    >
      <Icon className="size-5" aria-hidden="true" />
      <span className="sr-only">{state.message}</span>
    </span>
  );
}

function predictionFormValues(
  prediction:
    | {
        teamAScore: number;
        teamBScore: number;
        predictedAdvancingTeam: string | null;
      }
    | undefined,
): PredictionFormValues {
  return {
    teamAScore: prediction?.teamAScore.toString() ?? "",
    teamBScore: prediction?.teamBScore.toString() ?? "",
    predictedAdvancingTeam: prediction?.predictedAdvancingTeam ?? "",
  };
}

function scoreFromField(value: string) {
  if (value === "") {
    return null;
  }

  const score = Number(value);
  return Number.isInteger(score) && score >= 0 && score <= 99 ? score : null;
}

function focusNextPredictionScoreInput(currentInput: HTMLInputElement) {
  const scoreInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(PREDICTION_SCORE_INPUT_SELECTOR),
  );
  const currentIndex = scoreInputs.indexOf(currentInput);
  if (currentIndex === -1) {
    return;
  }

  const nextInput = scoreInputs
    .slice(currentIndex + 1)
    .find(isFocusablePredictionScoreInput);
  if (!nextInput) {
    return;
  }

  nextInput.focus();
  nextInput.select();
}

function isFocusablePredictionScoreInput(input: HTMLInputElement) {
  return (
    !input.disabled &&
    !input.readOnly &&
    input.getClientRects().length > 0 &&
    window.getComputedStyle(input).visibility !== "hidden"
  );
}
