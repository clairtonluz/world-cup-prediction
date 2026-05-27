"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { mayEditPrediction } from "@/lib/match-rules";
import { isTransactionConflict, runSerializableTransaction } from "@/lib/transactions";
import { advancingTeamPredictionForMatch } from "@/lib/tournament-predictions";
import { predictionSchema } from "@/lib/validation";

export async function savePredictionAction(formData: FormData) {
  const { user } = await requireUser();
  const returnTo = formData.get("returnTo") === "apostas" ? "apostas" : "match";
  const parsed = predictionSchema.safeParse({
    matchId: formData.get("matchId"),
    teamAScore: formData.get("teamAScore"),
    teamBScore: formData.get("teamBScore"),
    predictedAdvancingTeam: formData.get("predictedAdvancingTeam"),
  });

  if (!parsed.success) {
    redirect(
      feedbackUrl(returnTo === "apostas" ? "/apostas" : "/matches", {
        error: "invalid_prediction",
      }),
    );
  }

  const input = parsed.data;
  const returnPath =
    returnTo === "apostas" ? "/apostas" : `/matches/${input.matchId}`;
  let error: ErrorFeedbackCode | null;

  try {
    error = await runSerializableTransaction(async (tx) => {
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
        return "match_not_found";
      }

      if (!match.participantsConfirmed) {
        return "participants_pending";
      }

      if (!mayEditPrediction(match)) {
        return "predictions_closed";
      }

      const advancingPrediction = advancingTeamPredictionForMatch(match, input);
      if (!advancingPrediction.valid) {
        return "invalid_advancing_team_prediction";
      }

      await tx.prediction.upsert({
        where: { userId_matchId: { userId: user.id, matchId: match.id } },
        update: {
          teamAScore: input.teamAScore,
          teamBScore: input.teamBScore,
          predictedAdvancingTeam: advancingPrediction.value,
        },
        create: {
          userId: user.id,
          matchId: match.id,
          teamAScore: input.teamAScore,
          teamBScore: input.teamBScore,
          predictedAdvancingTeam: advancingPrediction.value,
        },
      });

      return null;
    });
  } catch (transactionError) {
    if (!isTransactionConflict(transactionError)) {
      throw transactionError;
    }
    error = "update_conflict";
  }

  if (error) {
    const pathname =
      error === "match_not_found" && returnTo !== "apostas"
        ? "/matches"
        : returnPath;
    redirect(feedbackUrl(pathname, { error }));
  }

  revalidatePath(`/matches/${input.matchId}`);
  revalidatePath("/matches");
  revalidatePath("/apostas");
  redirect(feedbackUrl(returnPath, { success: "prediction_saved" }));
}
