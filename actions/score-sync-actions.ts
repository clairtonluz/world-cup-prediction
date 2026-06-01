"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { EspnScoreboardRequestError } from "@/lib/score-sync/client";
import {
  importEspnEventIds,
  runManualScoreSync,
  runSingleMatchScoreSync,
  setMatchScoreSyncLocked,
  updateScoreSyncSettings,
} from "@/lib/score-sync/sync";
import { feedbackUrl, type ErrorFeedbackCode, type SuccessFeedbackCode } from "@/lib/feedback";
import { revalidateMatchResultViews } from "@/lib/match-result-revalidation";
import {
  scoreSyncSettingsSchema,
  matchIdSchema,
} from "@/lib/validation";

export async function updateScoreSyncSettingsAction(formData: FormData) {
  await requireAdmin();
  const parsed = scoreSyncSettingsSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    intervalMinutes: formData.get("intervalMinutes"),
  });
  if (!parsed.success) {
    redirect(feedbackUrl("/admin/matches", { error: "invalid_score_sync_settings" }));
  }

  await updateScoreSyncSettings(parsed.data);
  redirect(feedbackUrl("/admin/matches", { success: "score_sync_settings_updated" }));
}

export async function importEspnEventsAction() {
  await requireAdmin();

  try {
    await importEspnEventIds();
  } catch (error) {
    redirect(feedbackUrl("/admin/matches", { error: scoreSyncErrorCode(error) }));
  }

  revalidateMatchResultViews();
  redirect(feedbackUrl("/admin/matches", { success: "score_events_imported" }));
}

export async function runScoreSyncAction() {
  await requireAdmin();

  const result = await runManualScoreSync();
  const feedback = feedbackForSyncResult(result.status);
  if ("error" in feedback) {
    redirect(feedbackUrl("/admin/matches", feedback));
  }

  if (result.updatedMatches > 0) {
    revalidateMatchResultViews();
  }
  redirect(feedbackUrl("/admin/matches", feedback));
}

export async function runMatchScoreSyncAction(id: string, formData: FormData) {
  await requireAdmin();
  const parsedId = matchIdSchema.safeParse(id);
  if (!parsedId.success) {
    redirect(feedbackUrl("/admin/matches", { error: "match_not_found" }));
  }

  const { error, result } = await runSingleMatchScoreSync(parsedId.data, {
    overrideLock: formData.get("overrideLock") === "true",
  });
  if (error) {
    redirect(feedbackUrl(`/admin/matches/${parsedId.data}/edit`, { error }));
  }

  if (result.updatedMatches > 0) {
    revalidateMatchResultViews(parsedId.data);
  }
  redirect(feedbackUrl(`/admin/matches/${parsedId.data}/edit`, { success: "score_match_sync_completed" }));
}

export async function setMatchScoreSyncLockedAction(id: string, formData: FormData) {
  await requireAdmin();
  const parsedId = matchIdSchema.safeParse(id);
  if (!parsedId.success) {
    redirect(feedbackUrl("/admin/matches", { error: "match_not_found" }));
  }

  const locked = formData.get("scoreSyncLocked") === "true";
  await setMatchScoreSyncLocked(parsedId.data, locked);
  revalidateMatchResultViews(parsedId.data);
  redirect(
    feedbackUrl(`/admin/matches/${parsedId.data}/edit`, {
      success: locked ? "score_match_locked" : "score_match_unlocked",
    }),
  );
}

function feedbackForSyncResult(
  status: Awaited<ReturnType<typeof runManualScoreSync>>["status"],
): { success: SuccessFeedbackCode } | { error: ErrorFeedbackCode } {
  if (status === "completed") {
    return { success: "score_sync_completed" };
  }
  if (status === "no_matches") {
    return { error: "score_sync_no_matches" };
  }
  if (status === "locked") {
    return { error: "score_sync_locked" };
  }
  return { error: "score_sync_failed" };
}

function scoreSyncErrorCode(error: unknown): ErrorFeedbackCode {
  if (error instanceof EspnScoreboardRequestError) {
    return "score_sync_failed";
  }
  throw error;
}
