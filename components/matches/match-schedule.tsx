import Link from "next/link";
import { MatchTeams } from "@/components/shared/match-teams";
import { MatchStatusIndicator } from "@/components/matches/match-status-indicator";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import {
  BRAZIL_TIME_ZONE,
  formatMatchDay,
  formatMatchTime,
  formatStage,
  scoreText,
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
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full min-w-[700px] text-left text-sm">
              <tbody>
                {dailyMatches.map((match) => (
                  <tr key={match.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="w-16 p-3 text-slate-500">#{match.matchNumber}</td>
                    <td className="w-20 p-3 font-medium">{formatMatchTime(match.startsAt)}</td>
                    <td className="p-3">
                      <Link
                        href={`/matches/${match.id}`}
                        className="font-medium text-slate-950 hover:text-emerald-700"
                      >
                        <MatchTeams
                          teamA={match.teamA}
                          teamB={match.teamB}
                          teamASlot={match.teamASlot}
                          teamBSlot={match.teamBSlot}
                        />
                      </Link>
                      {!match.participantsConfirmed && (match.teamA || match.teamB) ? (
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">
                          Confronto projetado
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3 text-slate-600">
                      {formatStage(match.stage as MatchStageValue)}
                      <br />
                      <span className="text-xs">{match.venue}, {match.hostCity}</span>
                    </td>
                    <td className="p-3">
                      <MatchStatusIndicator
                        status={match.status as MatchStatusValue}
                        startsAt={match.startsAt}
                      />
                    </td>
                    <td className="p-3 text-right font-medium">
                      {scoreText(match.teamAScore, match.teamBScore)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date);
}
