import { matchDayKey } from "@/lib/display";

const NEARBY_MATCH_LIMIT = 3;

interface ScheduledMatch {
  startsAt: Date;
}

export type MatchFocusWindow<T extends ScheduledMatch> = {
  today: T[];
  previous: T[];
  upcoming: T[];
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
  const today = orderedMatches.filter(
    (match) => matchDayKey(match.startsAt) === todayKey,
  );

  if (today.length > 0) {
    return {
      today,
      previous: orderedMatches
        .filter((match) => matchDayKey(match.startsAt) < todayKey)
        .slice(-NEARBY_MATCH_LIMIT)
        .reverse(),
      upcoming: orderedMatches
        .filter((match) => matchDayKey(match.startsAt) > todayKey)
        .slice(0, NEARBY_MATCH_LIMIT),
    };
  }

  return {
    today,
    previous: orderedMatches
      .filter((match) => match.startsAt.getTime() < now.getTime())
      .slice(-NEARBY_MATCH_LIMIT)
      .reverse(),
    upcoming: orderedMatches
      .filter((match) => match.startsAt.getTime() >= now.getTime())
      .slice(0, NEARBY_MATCH_LIMIT),
  };
}

export function parseMatchAgendaView(
  value: string | string[] | undefined,
): MatchAgendaView {
  return value === "all" ? "all" : "focus";
}
