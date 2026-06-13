import { MatchCard } from "@/components/matches/match-card";
import {
  formatMatchDay,
  matchDayKey,
} from "@/lib/display";

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
  predictions?: {
    teamAScore: number;
    teamBScore: number;
    predictedAdvancingTeam: string | null;
    points: number;
  }[];
};

export function MatchSchedule({ matches }: { matches: ScheduleMatch[] }) {
  const grouped = new Map<string, ScheduleMatch[]>();
  for (const match of matches) {
    const key = matchDayKey(match.startsAt);
    grouped.set(key, [...(grouped.get(key) ?? []), match]);
  }

  return (
    <div className="space-y-6">
      {[...grouped.values()].map((dailyMatches) => (
        <section key={matchDayKey(dailyMatches[0].startsAt)}>
          <h3 className="mb-2 text-sm font-semibold capitalize text-slate-700">
            {formatMatchDay(dailyMatches[0].startsAt)}
          </h3>
          <div className="space-y-3">
            {dailyMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                showDetails
                fieldIdPrefix="schedule-match"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
