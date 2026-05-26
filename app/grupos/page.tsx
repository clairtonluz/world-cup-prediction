import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { MatchTeams } from "@/components/shared/match-teams";
import { TeamLabel } from "@/components/shared/team-label";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchStatusValue } from "@/lib/constants";
import { listGroupMatches } from "@/lib/data/matches";
import { formatMatchDate, formatStatus, scoreText } from "@/lib/display";
import {
  GROUP_CODES,
  calculateGroupStandings,
  hasProvisionalScore,
} from "@/lib/group-standings";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const matches = await listGroupMatches();

  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Grupos</h1>
        <p className="mt-1 text-slate-600">
          Classificação e jogos da primeira fase em horário de Brasília.
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        {GROUP_CODES.map((groupCode) => {
          const groupMatches = matches.filter((match) => match.groupCode === groupCode);
          const standings = calculateGroupStandings(groupMatches);
          const provisional = hasProvisionalScore(groupMatches);

          return (
            <Card key={groupCode}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Grupo {groupCode}</CardTitle>
                  {provisional ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      Classificação provisória
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-slate-500">
                      <tr>
                        <th className="py-2 text-left">Equipe</th>
                        {["P", "J", "V", "E", "D", "GP", "GC", "SG", "%"].map((label) => (
                          <th key={label} className="py-2 text-right">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row) => (
                        <tr key={row.team} className="border-b border-slate-100">
                          <td className="py-2 font-medium">
                            <TeamLabel team={row.team} />
                          </td>
                          <td className="py-2 text-right font-semibold">{row.points}</td>
                          <td className="py-2 text-right">{row.played}</td>
                          <td className="py-2 text-right">{row.wins}</td>
                          <td className="py-2 text-right">{row.draws}</td>
                          <td className="py-2 text-right">{row.losses}</td>
                          <td className="py-2 text-right">{row.goalsFor}</td>
                          <td className="py-2 text-right">{row.goalsAgainst}</td>
                          <td className="py-2 text-right">{row.goalDifference}</td>
                          <td className="py-2 text-right">{row.performance}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {[1, 2, 3].map((round) => (
                  <section key={round}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Rodada {round}
                    </h3>
                    <div className="space-y-2">
                      {groupMatches
                        .filter((match) => match.groupRound === round)
                        .map((match) => (
                          <Link
                            key={match.id}
                            href={`/matches/${match.id}`}
                            className="block rounded-md border p-3 text-sm hover:border-emerald-300 hover:bg-emerald-50"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <MatchTeams
                                teamA={match.teamA}
                                teamB={match.teamB}
                                className="font-medium"
                              />
                              <StatusBadge status={match.status as MatchStatusValue}>
                                {formatStatus(match.status as MatchStatusValue)}
                              </StatusBadge>
                            </div>
                            <div className="mt-1 flex justify-between text-xs text-slate-600">
                              <span>{formatMatchDate(match.startsAt)}</span>
                              <span>{scoreText(match.teamAScore, match.teamBScore)}</span>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </section>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
