import type { MatchStatusValue } from "@/lib/constants";

interface MatchTiming {
  startsAt: Date;
  status: MatchStatusValue;
}

export function hasEffectivelyStarted(match: MatchTiming, now = new Date()) {
  return match.status !== "SCHEDULED" || now.getTime() >= match.startsAt.getTime();
}

export function mayEditPrediction(match: MatchTiming, now = new Date()) {
  return !hasEffectivelyStarted(match, now);
}
