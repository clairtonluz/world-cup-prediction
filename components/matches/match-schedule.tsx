import Link from "next/link";
import { MatchStatusIndicator } from "@/components/matches/match-status-indicator";
import { TeamLabel } from "@/components/shared/team-label";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import {
  BRAZIL_TIME_ZONE,
  formatMatchDay,
  formatMatchTime,
  formatStage,
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
};

export function MatchSchedule({ matches }: { matches: ScheduleMatch[] }) {
  const grouped = new Map<string, ScheduleMatch[]>();
  for (const match of matches) {
    const key = dayKey(match.startsAt);
    grouped.set(key, [...(grouped.get(key) ?? []), match]);
  }

  return (
    <div className="space-y-6">
      {[...grouped.values()].map((dailyMatches) => (
        <section key={dayKey(dailyMatches[0].startsAt)}>
          <h3 className="mb-2 text-sm font-semibold capitalize text-slate-700">
            {formatMatchDay(dailyMatches[0].startsAt)}
          </h3>
          <div className="space-y-3">
            {dailyMatches.map((match) => (
              <article key={match.id} className="rounded-xl border bg-white p-4">
                <Link
                  href={`/matches/${match.id}`}
                  className="block rounded-lg text-slate-950 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]"
                >
                  <MatchScoreboard match={match} />
                </Link>
                {!match.participantsConfirmed && (match.teamA || match.teamB) ? (
                  <div className="mt-2 text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">
                      Confronto projetado
                    </span>
                  </div>
                ) : null}
                <div className="mt-4 flex flex-col items-center gap-3 border-t pt-3 text-center text-sm text-slate-600 sm:flex-row sm:justify-between sm:text-left">
                  <div>
                    <p className="font-medium text-slate-700">
                      Jogo #{match.matchNumber} - {formatMatchTime(match.startsAt)}
                    </p>
                    <p className="text-xs">
                      {formatStage(match.stage as MatchStageValue)} - {match.venue}, {match.hostCity}
                    </p>
                  </div>
                  <div className="flex justify-center sm:justify-end">
                    <MatchStatusIndicator
                      status={match.status as MatchStatusValue}
                      startsAt={match.startsAt}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MatchScoreboard({ match }: { match: ScheduleMatch }) {
  const hasScore = match.teamAScore !== null && match.teamBScore !== null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm font-medium sm:gap-4 sm:text-lg">
      <TeamLabel
        team={match.teamA}
        slot={match.teamASlot}
        className="min-w-0 justify-end text-right"
      />
      <span className="inline-flex items-center gap-2 font-semibold tabular-nums">
        {hasScore ? <span>{match.teamAScore}</span> : null}
        <span className="text-slate-400">x</span>
        {hasScore ? <span>{match.teamBScore}</span> : null}
      </span>
      <TeamLabel team={match.teamB} slot={match.teamBSlot} className="min-w-0" />
    </div>
  );
}

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date);
}
