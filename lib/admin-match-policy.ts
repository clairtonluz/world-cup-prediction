import type { ErrorFeedbackCode } from "@/lib/feedback";
import type { MatchStatusValue } from "@/lib/constants";

export type MatchPolicyValue = {
  status: MatchStatusValue;
};

export function updatedMatchError(
  current: MatchPolicyValue,
  update: MatchPolicyValue,
): ErrorFeedbackCode | null {
  if (current.status === "FINISHED" && update.status !== "FINISHED") {
    return "finished_match_locked";
  }

  if (current.status === "STARTED" && update.status === "SCHEDULED") {
    return "started_match_locked";
  }

  return null;
}
