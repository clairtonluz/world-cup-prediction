import { hasEffectivelyStarted } from "@/lib/match-rules";
import type { ErrorFeedbackCode } from "@/lib/feedback";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";

export type MatchPolicyValue = {
  teamA: string;
  teamB: string;
  stage: MatchStageValue;
  startsAt: Date;
  status: MatchStatusValue;
};

export function newMatchError(match: MatchPolicyValue): ErrorFeedbackCode | null {
  return match.status === "SCHEDULED" ? null : "new_match_must_be_scheduled";
}

export function updatedMatchError(
  current: MatchPolicyValue,
  update: MatchPolicyValue,
  now = new Date(),
): ErrorFeedbackCode | null {
  if (current.status === "FINISHED" && update.status !== "FINISHED") {
    return "finished_match_locked";
  }

  if (current.status === "STARTED" && update.status === "SCHEDULED") {
    return "started_match_locked";
  }

  if (hasEffectivelyStarted(current, now) && hasFixtureChanges(current, update)) {
    return "fixture_locked";
  }

  return null;
}

function hasFixtureChanges(current: MatchPolicyValue, update: MatchPolicyValue) {
  return (
    current.teamA !== update.teamA ||
    current.teamB !== update.teamB ||
    current.stage !== update.stage ||
    current.startsAt.getTime() !== update.startsAt.getTime()
  );
}
