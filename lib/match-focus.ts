import { matchDayKey } from "@/lib/display";

interface ScheduledMatch {
  startsAt: Date;
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
  const orderedMatches = [...matches].sort(
    (first, second) => first.startsAt.getTime() - second.startsAt.getTime(),
  );
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

export function parseMatchAgendaView(
  value: string | string[] | undefined,
): MatchAgendaView {
  return value === "all" ? "all" : "focus";
}
