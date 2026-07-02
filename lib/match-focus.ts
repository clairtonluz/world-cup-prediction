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
  timeZone?: string,
): MatchFocusWindow<T> {
  const orderedMatches = orderMatchesChronologically(matches);
  const todayKey = matchDayKey(now, timeZone);
  const matchesWithDay = orderedMatches.map((match) => ({
    match,
    dayKey: matchDayKey(match.startsAt, timeZone),
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
  const currentOrNextMatch = findCurrentOrNextMatch(orderedMatches, now);
  if (currentOrNextMatch) {
    return currentOrNextMatch;
  }

  for (let index = orderedMatches.length - 1; index >= 0; index -= 1) {
    const match = orderedMatches[index];
    if (match.status === "FINISHED" || match.startsAt.getTime() < now.getTime()) {
      return match;
    }
  }

  return null;
}

export function selectCurrentOrNextMatch<T extends TimelineMatch>(
  matches: readonly T[],
  now = new Date(),
): T | null {
  return findCurrentOrNextMatch(orderMatchesChronologically(matches), now);
}

function findCurrentOrNextMatch<T extends TimelineMatch>(
  orderedMatches: readonly T[],
  now: Date,
): T | null {
  const startedMatch = orderedMatches.find((match) => match.status === "STARTED");
  if (startedMatch) {
    return startedMatch;
  }

  return (
    orderedMatches.find(
      (match) =>
        match.status !== "FINISHED" && match.startsAt.getTime() >= now.getTime(),
    ) ?? null
  );
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
