"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { newMatchError, updatedMatchError } from "@/lib/admin-match-policy";
import { getDb } from "@/lib/db";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { calculatePredictionPoints } from "@/lib/scoring";
import { isTransactionConflict, runSerializableTransaction } from "@/lib/transactions";
import { matchInputSchema } from "@/lib/validation";
import type { MatchStageValue } from "@/lib/constants";

function parseMatchForm(formData: FormData) {
  const status = formData.get("status") ?? "SCHEDULED";
  return matchInputSchema.safeParse({
    teamA: formData.get("teamA"),
    teamB: formData.get("teamB"),
    stage: formData.get("stage"),
    startsAt: formData.get("startsAt"),
    status,
    teamAScore: status === "FINISHED" ? formData.get("teamAScore") : null,
    teamBScore: status === "FINISHED" ? formData.get("teamBScore") : null,
  });
}

export async function createMatchAction(formData: FormData) {
  await requireAdmin();
  const parsed = parseMatchForm(formData);
  if (!parsed.success) {
    redirect(feedbackUrl("/admin/matches/new", { error: "invalid_match" }));
  }

  const policyError = newMatchError(parsed.data);
  if (policyError) {
    redirect(feedbackUrl("/admin/matches/new", { error: policyError }));
  }

  const match = await getDb().match.create({ data: parsed.data });
  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  redirect(feedbackUrl(`/admin/matches/${match.id}/edit`, { success: "match_created" }));
}

export async function updateMatchAction(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseMatchForm(formData);
  if (!parsed.success) {
    redirect(feedbackUrl(`/admin/matches/${id}/edit`, { error: "invalid_match" }));
  }

  let error: ErrorFeedbackCode | null;

  try {
    error = await runSerializableTransaction(async (tx) => {
      const existing = await tx.match.findUnique({ where: { id } });
      if (!existing) {
        return "match_not_found";
      }

      const policyError = updatedMatchError(existing, parsed.data);
      if (policyError) {
        return policyError;
      }

      const match = await tx.match.update({ where: { id }, data: parsed.data });

      if (
        match.status === "FINISHED" &&
        match.teamAScore !== null &&
        match.teamBScore !== null
      ) {
        const predictions = await tx.prediction.findMany({ where: { matchId: id } });
        for (const prediction of predictions) {
          const result = calculatePredictionPoints(prediction, {
            stage: match.stage as MatchStageValue,
            teamAScore: match.teamAScore,
            teamBScore: match.teamBScore,
          });
          await tx.prediction.update({
            where: { id: prediction.id },
            data: { points: result.points },
          });
        }
      }

      return null;
    });
  } catch (transactionError) {
    if (!isTransactionConflict(transactionError)) {
      throw transactionError;
    }
    error = "update_conflict";
  }

  if (error) {
    const pathname = error === "match_not_found" ? "/admin/matches" : `/admin/matches/${id}/edit`;
    redirect(feedbackUrl(pathname, { error }));
  }

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  revalidatePath(`/matches/${id}`);
  revalidatePath("/ranking");
  revalidatePath("/me");
  redirect(feedbackUrl(`/admin/matches/${id}/edit`, { success: "match_updated" }));
}
