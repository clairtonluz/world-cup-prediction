import { matchDayKey } from "@/lib/display";

export type AdminMatchAgendaView = "current" | "all";

type MatchWithStart = {
  startsAt: Date | string;
};

export function parseAdminMatchAgendaView(
  value: string | string[] | undefined,
): AdminMatchAgendaView {
  return value === "all" ? "all" : "current";
}

export function filterAdminMatches<T extends MatchWithStart>(
  matches: readonly T[],
  {
    view,
    referenceTime,
    timeZone,
  }: {
    view: AdminMatchAgendaView;
    referenceTime: Date;
    timeZone: string;
  },
) {
  if (view === "all") {
    return [...matches];
  }

  const todayKey = matchDayKey(referenceTime, timeZone);
  return matches.filter(
    (match) => matchDayKey(toDate(match.startsAt), timeZone) >= todayKey,
  );
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}
