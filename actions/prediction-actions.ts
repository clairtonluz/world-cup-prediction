"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import {
  ERROR_MESSAGES,
  feedbackUrl,
  SUCCESS_MESSAGES,
  type ErrorFeedbackCode,
} from "@/lib/feedback";
import { mayEditPrediction } from "@/lib/match-rules";
import { isTransactionConflict, runSerializableTransaction } from "@/lib/transactions";
import { advancingTeamPredictionForMatch } from "@/lib/tournament-predictions";
import { predictionSchema } from "@/lib/validation";

type PredictionReturnDestination = "match" | "matches" | "apostas";
type PredictionInput = {
  matchId: string;
  teamAScore: number;
  teamBScore: number;
  predictedAdvancingTeam: string | null;
};
type SavedPrediction = {
  teamAScore: number;
  teamBScore: number;
  predictedAdvancingTeam: string | null;
};
type PersistPredictionResult =
  | { error: ErrorFeedbackCode; prediction?: never }
  | { error: null; prediction: SavedPrediction };

export type InlinePredictionActionState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt: number;
  prediction?: {
    teamAScore: string;
    teamBScore: string;
    predictedAdvancingTeam: string;
  };
};

export async function savePredictionAction(formData: FormData) {
  const { user } = await requireUser();
  const returnTo = predictionReturnDestination(formData.get("returnTo"));
  const parsed = parsePredictionForm(formData);

  if (!parsed.success) {
    redirect(
      feedbackUrl(predictionReturnPath(returnTo), {
        error: "invalid_prediction",
      }),
    );
  }

  const input = parsed.data;
  const returnPath = predictionReturnPath(returnTo, input.matchId);
  const result = await persistPrediction(user.id, input);

  if (result.error) {
    const pathname =
      result.error === "match_not_found" && returnTo !== "apostas"
        ? "/matches"
        : returnPath;
    redirect(feedbackUrl(pathname, { error: result.error }));
  }

  revalidatePredictionPaths(input.matchId);
  redirect(feedbackUrl(returnPath, { success: "prediction_saved" }));
}

export async function saveInlinePredictionAction(
  previousState: InlinePredictionActionState,
  formData: FormData,
): Promise<InlinePredictionActionState> {
  const { user } = await requireUser();
  const parsed = parsePredictionForm(formData);

  if (!parsed.success) {
    return inlinePredictionError("invalid_prediction", previousState.prediction);
  }

  const result = await persistPrediction(user.id, parsed.data);
  if (result.error) {
    return inlinePredictionError(result.error, previousState.prediction);
  }

  revalidatePredictionPaths(parsed.data.matchId);

  return {
    status: "success",
    message: SUCCESS_MESSAGES.prediction_saved,
    submittedAt: Date.now(),
    prediction: predictionFormValues(result.prediction),
  };
}

function parsePredictionForm(formData: FormData) {
  return predictionSchema.safeParse({
    matchId: formData.get("matchId"),
    teamAScore: formData.get("teamAScore"),
    teamBScore: formData.get("teamBScore"),
    predictedAdvancingTeam: formData.get("predictedAdvancingTeam"),
  });
}

async function persistPrediction(
  userId: string,
  input: PredictionInput,
): Promise<PersistPredictionResult> {
  try {
    return await runSerializableTransaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: input.matchId },
        select: {
          id: true,
          startsAt: true,
          status: true,
          participantsConfirmed: true,
          stage: true,
          teamA: true,
          teamB: true,
        },
      });

      if (!match) {
        return predictionError("match_not_found");
      }

      if (!match.participantsConfirmed) {
        return predictionError("participants_pending");
      }

      if (!mayEditPrediction(match)) {
        return predictionError("predictions_closed");
      }

      const advancingPrediction = advancingTeamPredictionForMatch(match, input);
      if (!advancingPrediction.valid) {
        return predictionError("invalid_advancing_team_prediction");
      }

      const prediction = {
        teamAScore: input.teamAScore,
        teamBScore: input.teamBScore,
        predictedAdvancingTeam: advancingPrediction.value,
      };

      await tx.prediction.upsert({
        where: { userId_matchId: { userId, matchId: match.id } },
        update: prediction,
        create: {
          userId,
          matchId: match.id,
          ...prediction,
        },
      });

      return { error: null, prediction };
    });
  } catch (transactionError) {
    if (!isTransactionConflict(transactionError)) {
      throw transactionError;
    }

    return predictionError("update_conflict");
  }
}

function predictionError(error: ErrorFeedbackCode): PersistPredictionResult {
  return { error };
}

function inlinePredictionError(
  error: ErrorFeedbackCode,
  prediction?: InlinePredictionActionState["prediction"],
): InlinePredictionActionState {
  return {
    status: "error",
    message: ERROR_MESSAGES[error],
    submittedAt: Date.now(),
    prediction,
  };
}

function predictionFormValues(prediction: SavedPrediction) {
  return {
    teamAScore: prediction.teamAScore.toString(),
    teamBScore: prediction.teamBScore.toString(),
    predictedAdvancingTeam: prediction.predictedAdvancingTeam ?? "",
  };
}

function revalidatePredictionPaths(matchId: string) {
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  revalidatePath("/apostas");
}

function predictionReturnDestination(
  value: FormDataEntryValue | null,
): PredictionReturnDestination {
  return value === "apostas" || value === "matches" ? value : "match";
}

function predictionReturnPath(
  returnTo: PredictionReturnDestination,
  matchId?: string,
) {
  if (returnTo === "apostas") {
    return "/apostas";
  }

  if (returnTo === "matches" || !matchId) {
    return "/matches";
  }

  return `/matches/${matchId}`;
}
