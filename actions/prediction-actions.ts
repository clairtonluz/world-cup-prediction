"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { mayEditPrediction } from "@/lib/match-rules";
import { isTransactionConflict, runSerializableTransaction } from "@/lib/transactions";
import { predictionSchema } from "@/lib/validation";

export async function savePredictionAction(formData: FormData) {
  const { user } = await requireUser();
  const parsed = predictionSchema.safeParse({
    matchId: formData.get("matchId"),
    teamAScore: formData.get("teamAScore"),
    teamBScore: formData.get("teamBScore"),
  });

  if (!parsed.success) {
    redirect(feedbackUrl("/matches", { error: "invalid_prediction" }));
  }

  const input = parsed.data;
  let error: ErrorFeedbackCode | null;

  try {
    error = await runSerializableTransaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: input.matchId },
        select: { id: true, startsAt: true, status: true },
      });

      if (!match) {
        return "match_not_found";
      }

      if (!mayEditPrediction(match)) {
        return "predictions_closed";
      }

      await tx.prediction.upsert({
        where: { userId_matchId: { userId: user.id, matchId: match.id } },
        update: { teamAScore: input.teamAScore, teamBScore: input.teamBScore },
        create: {
          userId: user.id,
          matchId: match.id,
          teamAScore: input.teamAScore,
          teamBScore: input.teamBScore,
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
      error === "match_not_found" ? "/matches" : `/matches/${input.matchId}`;
    redirect(feedbackUrl(pathname, { error }));
  }

  revalidatePath(`/matches/${input.matchId}`);
  revalidatePath("/matches");
  redirect(feedbackUrl(`/matches/${input.matchId}`, { success: "prediction_saved" }));
}
