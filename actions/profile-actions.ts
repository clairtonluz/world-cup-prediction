"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { mayEditChampionPrediction } from "@/lib/tournament-predictions";
import { isTransactionConflict, runSerializableTransaction } from "@/lib/transactions";
import { championPredictionSchema, favoriteTeamSchema } from "@/lib/validation";

export async function updateFavoriteTeamAction(formData: FormData) {
  const { user } = await requireUser();
  const parsed = favoriteTeamSchema.safeParse({
    favoriteTeam: formData.get("favoriteTeam"),
  });

  if (!parsed.success) {
    redirect(feedbackUrl("/me", { error: "invalid_favorite_team" }));
  }

  await getDb().user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  revalidatePath("/me");
  redirect(feedbackUrl("/me", { success: "favorite_team_updated" }));
}

export async function updatePredictedChampionAction(formData: FormData) {
  const { user } = await requireUser();
  const parsed = championPredictionSchema.safeParse({
    predictedChampion: formData.get("predictedChampion"),
  });

  if (!parsed.success) {
    redirect(feedbackUrl("/me", { error: "invalid_predicted_champion" }));
  }

  let error: ErrorFeedbackCode | null;
  try {
    error = await runSerializableTransaction(async (tx) => {
      const openingMatch = await tx.match.findFirst({
        select: { startsAt: true, status: true },
        orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }],
      });

      if (!mayEditChampionPrediction(openingMatch)) {
        return "champion_prediction_closed";
      }

      const predictedChampion = parsed.data.predictedChampion;
      if (predictedChampion) {
        const tournamentTeam = await tx.match.findFirst({
          where: {
            stage: "GROUP_STAGE",
            participantsConfirmed: true,
            OR: [{ teamA: predictedChampion }, { teamB: predictedChampion }],
          },
          select: { id: true },
        });
        if (!tournamentTeam) {
          return "invalid_predicted_champion";
        }
      }

      await tx.user.update({
        where: { id: user.id },
        data: { predictedChampion },
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
    redirect(feedbackUrl("/me", { error }));
  }

  revalidatePath("/me");
  redirect(feedbackUrl("/me", { success: "predicted_champion_updated" }));
}
