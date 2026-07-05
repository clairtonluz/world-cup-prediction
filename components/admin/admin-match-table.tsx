"use client";

import Link from "next/link";
import { BrowserDateTime, useBrowserTimeZone } from "@/components/shared/browser-date-time";
import { MatchScoreboard } from "@/components/shared/match-scoreboard";
import { MatchTeams } from "@/components/shared/match-teams";
import { OfficialMatchOutcome } from "@/components/shared/official-match-outcome";
import { StatusBadge } from "@/components/ui/badge";
import {
  type AdminMatchAgendaView,
  filterAdminMatches,
} from "@/lib/admin-match-filter";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { formatStage, formatStatus } from "@/lib/display";

type AdminMatch = {
  id: string;
  matchNumber: number;
  teamA: string | null;
  teamB: string | null;
  teamASlot: string | null;
  teamBSlot: string | null;
  stage: string;
  startsAt: Date | string;
  status: string;
  teamAScore: number | null;
  teamBScore: number | null;
  advancingTeam: string | null;
};

export function AdminMatchTable({
  matches,
  view,
  referenceTime,
}: {
  matches: AdminMatch[];
  view: AdminMatchAgendaView;
  referenceTime: Date | string;
}) {
  const timeZone = useBrowserTimeZone();
  const visibleMatches = filterAdminMatches(matches, {
    view,
    referenceTime: toDate(referenceTime),
    timeZone,
  });

  if (visibleMatches.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        {matches.length === 0
          ? "Nenhum jogo cadastrado."
          : "Nenhum jogo de hoje em diante. Use o botão acima para ver jogos anteriores."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-slate-500">
          <tr>
            <th className="py-3">Jogo</th>
            <th>Fase / horário</th>
            <th>Status</th>
            <th>Placar</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibleMatches.map((match) => (
            <tr key={match.id} className="border-b border-slate-100">
              <td className="py-4 font-medium">
                <span className="mr-2 text-slate-500">
                  #{match.matchNumber}
                </span>
                <MatchTeams
                  teamA={match.teamA}
                  teamB={match.teamB}
                  teamASlot={match.teamASlot}
                  teamBSlot={match.teamBSlot}
                  linkToTeamMatches
                />
              </td>
              <td>
                {formatStage(match.stage as MatchStageValue)}
                <br />
                <span className="text-slate-500">
                  <BrowserDateTime value={match.startsAt} format="matchDate" />
                </span>
              </td>
              <td>
                <StatusBadge status={match.status as MatchStatusValue}>
                  {formatStatus(match.status as MatchStatusValue)}
                </StatusBadge>
              </td>
              <td className="min-w-64">
                <MatchScoreboard
                  teamA={match.teamA}
                  teamB={match.teamB}
                  teamASlot={match.teamASlot}
                  teamBSlot={match.teamBSlot}
                  linkToTeamMatches
                  teamAScore={match.teamAScore}
                  teamBScore={match.teamBScore}
                  size="compact"
                />
                <OfficialMatchOutcome
                  stage={match.stage as MatchStageValue}
                  advancingTeam={match.advancingTeam}
                  linkToTeamMatches
                  className="mt-2"
                />
              </td>
              <td className="text-right">
                <Link
                  className="text-emerald-700 hover:underline"
                  href={`/admin/matches/${match.id}/edit`}
                >
                  Atualizar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}
