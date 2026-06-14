import { matchDayKey } from "@/lib/display";

interface ScheduledMatch {
  startsAt: Date;
}

interface TimelineMatch extends ScheduledMatch {
  status: string;
}

export type MatchFocusWindow<T extends ScheduledMatch> = {
  today: T[];
  nextDay: T[];
};

export type MatchAgendaView = "focus" | "all";

export function selectFocusedMatches<T extends ScheduledMatch>(
  matches: readonly T[],
  now = new Date(),
): MatchFocusWindow<T> {
  const orderedMatches = orderMatchesChronologically(matches);
  const todayKey = matchDayKey(now);
  const matchesWithDay = orderedMatches.map((match) => ({
    match,
    dayKey: matchDayKey(match.startsAt),
  }));
  const today = matchesWithDay
    .filter(({ dayKey }) => dayKey === todayKey)
    .map(({ match }) => match);
  const nextDayKey = matchesWithDay.find(
    ({ dayKey }) => dayKey > todayKey,
  )?.dayKey;
  const nextDay = nextDayKey
    ? matchesWithDay
        .filter(({ dayKey }) => dayKey === nextDayKey)
        .map(({ match }) => match)
    : [];

  return {
    today,
    nextDay,
  };
}

export function selectTeamTimelineFocusMatch<T extends TimelineMatch>(
  matches: readonly T[],
  now = new Date(),
): T | null {
  const orderedMatches = orderMatchesChronologically(matches);
  const startedMatch = orderedMatches.find((match) => match.status === "STARTED");
  if (startedMatch) {
    return startedMatch;
  }

  const nextFutureMatch = orderedMatches.find(
    (match) =>
      match.status !== "FINISHED" && match.startsAt.getTime() >= now.getTime(),
  );
  if (nextFutureMatch) {
    return nextFutureMatch;
  }

  for (let index = orderedMatches.length - 1; index >= 0; index -= 1) {
    const match = orderedMatches[index];
    if (match.status === "FINISHED" || match.startsAt.getTime() < now.getTime()) {
      return match;
    }
  }

  return null;
}

export function parseMatchAgendaView(
  value: string | string[] | undefined,
): MatchAgendaView {
  return value === "all" ? "all" : "focus";
}

function orderMatchesChronologically<T extends ScheduledMatch>(
  matches: readonly T[],
) {
  return [...matches].sort(
    (first, second) => first.startsAt.getTime() - second.startsAt.getTime(),
  );
}
