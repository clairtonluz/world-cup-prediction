import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { MatchScoreboard } from "@/components/shared/match-scoreboard";
import { TeamLabel } from "@/components/shared/team-label";
import { MatchStatusIndicator } from "@/components/matches/match-status-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import type { MatchStatusValue } from "@/lib/constants";
import { listGroupMatches } from "@/lib/data/matches";
import { formatMatchDate } from "@/lib/display";
import {
  GROUP_CODES,
  calculateGroupStandings,
  hasProvisionalScore,
  type StandingRow,
} from "@/lib/group-standings";

export const dynamic = "force-dynamic";

const standingsColumns = [
  { label: "P", description: "Pontos", value: (row: StandingRow) => row.points, emphasized: true },
  { label: "J", description: "Jogos", value: (row: StandingRow) => row.played },
  { label: "V", description: "Vitórias", value: (row: StandingRow) => row.wins },
  { label: "E", description: "Empates", value: (row: StandingRow) => row.draws },
  { label: "D", description: "Derrotas", value: (row: StandingRow) => row.losses },
  { label: "GP", description: "Gols pró", value: (row: StandingRow) => row.goalsFor },
  { label: "GC", description: "Gols contra", value: (row: StandingRow) => row.goalsAgainst },
  { label: "SG", description: "Saldo de gols", value: (row: StandingRow) => row.goalDifference },
  { label: "%", description: "Aproveitamento", value: (row: StandingRow) => `${row.performance}%` },
];

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
      <div className="space-y-6">
        {GROUP_CODES.map((groupCode) => {
          const groupMatches = matches.filter((match) => match.groupCode === groupCode);
          const standings = calculateGroupStandings(groupMatches);
          const provisional = hasProvisionalScore(groupMatches);

          return (
            <Card key={groupCode}>
              <CardHeader>
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Grupo {groupCode}</CardTitle>
                  {provisional ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      Classificação provisória
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <table className="hidden w-full table-fixed text-sm lg:table">
                  <caption className="sr-only">Classificação do Grupo {groupCode}</caption>
                  <thead className="border-b text-slate-500">
                    <tr>
                      <th scope="col" className="w-[28%] py-3 text-left">Equipe</th>
                      {standingsColumns.map(({ label, description }) => (
                        <th key={label} scope="col" className="px-2 py-3 text-right">
                          <Tooltip label={label} description={description} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => (
                      <tr key={row.team} className="border-b border-slate-100">
                        <th scope="row" className="py-3 text-left font-medium">
                          <TeamLabel team={row.team} />
                        </th>
                        {standingsColumns.map(({ label, value, emphasized }) => (
                          <td
                            key={label}
                            className={`px-2 py-3 text-right tabular-nums${emphasized ? " font-semibold" : ""}`}
                          >
                            {value(row)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                  {standings.map((row) => (
                    <section key={row.team} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h3 className="font-medium text-slate-950">
                        <TeamLabel team={row.team} />
                      </h3>
                      <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-3">
                        {standingsColumns.map(({ label, description, value, emphasized }) => (
                          <div key={label}>
                            <dt className="text-xs text-slate-500">{description}</dt>
                            <dd className={`mt-0.5 tabular-nums text-slate-950${emphasized ? " font-semibold" : ""}`}>
                              {value(row)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
                <div className="grid gap-5 lg:grid-cols-3">
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
                              <MatchScoreboard
                                teamA={match.teamA}
                                teamB={match.teamB}
                                teamASlot={match.teamASlot}
                                teamBSlot={match.teamBSlot}
                                teamAScore={match.teamAScore}
                                teamBScore={match.teamBScore}
                              />
                              <div className="mt-3 flex flex-col items-start gap-2">
                                <MatchStatusIndicator
                                  status={match.status as MatchStatusValue}
                                  startsAt={match.startsAt}
                                />
                              </div>
                              <div className="mt-2 text-xs text-slate-600">
                                <p>{formatMatchDate(match.startsAt)}</p>
                              </div>
                            </Link>
                          ))}
                      </div>
                    </section>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
