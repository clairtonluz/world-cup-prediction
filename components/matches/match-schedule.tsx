"use client";

import { MatchCard } from "@/components/matches/match-card";
import {
  BrowserDateTime,
  useBrowserTimeZone,
} from "@/components/shared/browser-date-time";
import { matchDayKey } from "@/lib/display";
import { cn } from "@/lib/utils";

type ScheduleMatch = {
  id: string;
  matchNumber: number;
  teamA: string | null;
  teamB: string | null;
  teamASlot: string | null;
  teamBSlot: string | null;
  participantsConfirmed: boolean;
  stage: string;
  startsAt: Date;
  venue: string;
  hostCity: string;
  status: string;
  teamAScore: number | null;
  teamBScore: number | null;
  advancingTeam: string | null;
  predictions?: {
    teamAScore: number;
    teamBScore: number;
    predictedAdvancingTeam: string | null;
    points: number;
  }[];
};

type MatchScheduleProps = {
  matches: ScheduleMatch[];
  focusedMatchId?: string | null;
  focusedMatchElementId?: string;
};

export function MatchSchedule({
  matches,
  focusedMatchId = null,
  focusedMatchElementId = "focused-match",
}: MatchScheduleProps) {
  const timeZone = useBrowserTimeZone();
  const grouped = new Map<string, ScheduleMatch[]>();
  for (const match of matches) {
    const key = matchDayKey(match.startsAt, timeZone);
    grouped.set(key, [...(grouped.get(key) ?? []), match]);
  }

  return (
    <div className="space-y-6">
      {[...grouped.values()].map((dailyMatches) => (
        <section key={matchDayKey(dailyMatches[0].startsAt, timeZone)}>
          <h3 className="mb-2 text-sm font-semibold capitalize text-slate-700">
            <BrowserDateTime
              value={dailyMatches[0].startsAt}
              format="matchDay"
            />
          </h3>
          <div className="space-y-3">
            {dailyMatches.map((match) => {
              const focused = match.id === focusedMatchId;

              return (
                <div
                  key={match.id}
                  id={focused ? focusedMatchElementId : undefined}
                  tabIndex={focused ? -1 : undefined}
                  className={cn(
                    focused &&
                      "scroll-mt-24 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                  )}
                >
                  <MatchCard
                    match={match}
                    highlighted={focused}
                    showDetails
                    fieldIdPrefix="schedule-match"
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
