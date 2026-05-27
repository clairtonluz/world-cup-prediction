import Link from "next/link";
import { MatchStatusIndicator } from "@/components/matches/match-status-indicator";
import { MatchScoreboard } from "@/components/shared/match-scoreboard";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import {
  formatMatchDay,
  formatMatchTime,
  formatStage,
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
              <article key={match.id} className="rounded-xl border bg-white p-4">
                <Link
                  href={`/matches/${match.id}`}
                  className="block rounded-lg text-slate-950 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]"
                >
                  <MatchScoreboard
                    teamA={match.teamA}
                    teamB={match.teamB}
                    teamASlot={match.teamASlot}
                    teamBSlot={match.teamBSlot}
                    teamAScore={match.teamAScore}
                    teamBScore={match.teamBScore}
                  />
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
