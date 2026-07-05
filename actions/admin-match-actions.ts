"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { applyMatchResult } from "@/lib/match-result-application";
import { revalidateMatchResultViews } from "@/lib/match-result-revalidation";
import { recalculateAllMatchPredictions } from "@/lib/match-results";
import { isTransactionConflict, runSerializableTransaction } from "@/lib/transactions";
import {
  matchIdSchema,
  matchResultSchema,
  matchStartsAtSchema,
} from "@/lib/validation";

function parseResultForm(formData: FormData) {
  const status = formData.get("status") ?? "SCHEDULED";
  return matchResultSchema.safeParse({
    status,
    teamAScore: status === "SCHEDULED" ? null : formData.get("teamAScore"),
    teamBScore: status === "SCHEDULED" ? null : formData.get("teamBScore"),
    advancingTeam: status === "FINISHED" ? formData.get("advancingTeam") : null,
  });
}

function parseStartForm(formData: FormData) {
  return matchStartsAtSchema.safeParse({
    startsAt: formData.get("startsAt"),
  });
}

export async function recalculateAllPointsAction() {
  await requireAdmin();

  let error: ErrorFeedbackCode | null = null;
  try {
    await runSerializableTransaction(recalculateAllMatchPredictions);
  } catch (transactionError) {
    if (!isTransactionConflict(transactionError)) {
      throw transactionError;
    }
    error = "update_conflict";
  }

  if (error) {
    redirect(feedbackUrl("/admin/matches", { error }));
  }

  revalidateMatchResultViews();
  redirect(feedbackUrl("/admin/matches", { success: "points_recalculated" }));
}

export async function updateMatchAction(id: string, formData: FormData) {
  await requireAdmin();
  const parsedId = matchIdSchema.safeParse(id);
  if (!parsedId.success) {
    redirect(feedbackUrl("/admin/matches", { error: "match_not_found" }));
  }
  const matchId = parsedId.data;
  const parsed = parseResultForm(formData);
  if (!parsed.success) {
    redirect(feedbackUrl(`/admin/matches/${matchId}/edit`, { error: "invalid_result" }));
  }
  const parsedStart = parseStartForm(formData);
  if (!parsedStart.success) {
    redirect(feedbackUrl(`/admin/matches/${matchId}/edit`, { error: "invalid_match_start" }));
  }

  let error: ErrorFeedbackCode | null = null;
  let feedback: "match_updated" | "match_updated_predictions_reset" | "match_updated_propagation_blocked" =
    "match_updated";

  try {
    const result = await runSerializableTransaction(async (tx) => {
      return applyMatchResult(tx, matchId, {
        ...parsed.data,
        startsAt: parsedStart.data.startsAt,
      });
    });

    error = result.error;
    if (!error && result.propagation?.blockedMatches) {
      feedback = "match_updated_propagation_blocked";
    } else if (!error && result.propagation?.invalidatedPredictions) {
      feedback = "match_updated_predictions_reset";
    }
  } catch (transactionError) {
    if (!isTransactionConflict(transactionError)) {
      throw transactionError;
    }
    error = "update_conflict";
  }

  if (error) {
    const pathname =
      error === "match_not_found" ? "/admin/matches" : `/admin/matches/${matchId}/edit`;
    redirect(feedbackUrl(pathname, { error }));
  }

  revalidateMatchResultViews(matchId);
  redirect(feedbackUrl(`/admin/matches/${matchId}/edit`, { success: feedback }));
}
