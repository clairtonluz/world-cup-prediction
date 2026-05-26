import type { MatchStatusValue } from "@/lib/constants";

interface MatchTiming {
  startsAt: Date;
  status: MatchStatusValue;
}

interface PredictableMatch extends MatchTiming {
  participantsConfirmed?: boolean;
}

export function hasEffectivelyStarted(match: MatchTiming, now = new Date()) {
  return match.status !== "SCHEDULED" || now.getTime() >= match.startsAt.getTime();
}

export function mayEditPrediction(match: PredictableMatch, now = new Date()) {
  return (
    match.participantsConfirmed !== false &&
    !hasEffectivelyStarted(match, now)
  );
}
