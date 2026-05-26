"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { updatedMatchError } from "@/lib/admin-match-policy";
import { propagateFutureParticipants } from "@/lib/bracket-propagation";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { recalculateMatchPredictions } from "@/lib/match-results";
import { isTransactionConflict, runSerializableTransaction } from "@/lib/transactions";
import { matchIdSchema, matchResultSchema } from "@/lib/validation";

function parseResultForm(formData: FormData) {
  const status = formData.get("status") ?? "SCHEDULED";
  return matchResultSchema.safeParse({
    status,
    teamAScore: status === "SCHEDULED" ? null : formData.get("teamAScore"),
    teamBScore: status === "SCHEDULED" ? null : formData.get("teamBScore"),
    advancingTeam: status === "FINISHED" ? formData.get("advancingTeam") : null,
  });
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

  let error: ErrorFeedbackCode | null = null;
  let feedback: "match_updated" | "match_updated_predictions_reset" | "match_updated_propagation_blocked" =
    "match_updated";

  try {
    const result = await runSerializableTransaction(async (tx) => {
      const existing = await tx.match.findUnique({ where: { id: matchId } });
      if (!existing) {
        return { error: "match_not_found" as const, propagation: null };
      }

      const policyError = updatedMatchError(existing, parsed.data);
      if (policyError) {
        return { error: policyError, propagation: null };
      }

      if (parsed.data.status !== "SCHEDULED" && !existing.participantsConfirmed) {
        return { error: "participants_pending" as const, propagation: null };
      }

      const advancingTeam = advancingTeamForResult(existing, parsed.data);
      if (advancingTeam.error) {
        return { error: advancingTeam.error, propagation: null };
      }

      const match = await tx.match.update({
        where: { id: matchId },
        data: {
          status: parsed.data.status,
          teamAScore: parsed.data.teamAScore,
          teamBScore: parsed.data.teamBScore,
          advancingTeam: advancingTeam.value,
        },
      });

      await recalculateMatchPredictions(tx, match);
      const propagation = await propagateFutureParticipants(tx);
      return { error: null, propagation };
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

  revalidatePath("/admin/matches");
  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/grupos");
  revalidatePath("/ranking");
  revalidatePath("/me");
  redirect(feedbackUrl(`/admin/matches/${matchId}/edit`, { success: feedback }));
}

function advancingTeamForResult(
  match: {
    stage: string;
    teamA: string | null;
    teamB: string | null;
  },
  result: {
    status: string;
    teamAScore: number | null;
    teamBScore: number | null;
    advancingTeam: string | null;
  },
): { value: string | null; error: ErrorFeedbackCode | null } {
  if (result.status !== "FINISHED" || match.stage === "GROUP_STAGE") {
    return { value: null, error: null };
  }

  if (!match.teamA || !match.teamB) {
    return { value: null, error: "unresolved_match" };
  }

  if (result.teamAScore === result.teamBScore) {
    if (
      result.advancingTeam !== match.teamA &&
      result.advancingTeam !== match.teamB
    ) {
      return { value: null, error: "knockout_qualifier_required" };
    }
    return { value: result.advancingTeam, error: null };
  }

  return {
    value: result.teamAScore! > result.teamBScore! ? match.teamA : match.teamB,
    error: null,
  };
}
