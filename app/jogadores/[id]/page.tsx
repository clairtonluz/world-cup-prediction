import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { MatchScoreboard } from "@/components/shared/match-scoreboard";
import { OfficialMatchOutcome } from "@/components/shared/official-match-outcome";
import { TeamLabel } from "@/components/shared/team-label";
import { StatCard } from "@/components/stats/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { getPlayerScorePageData, type PlayerScorePageData } from "@/lib/data/player-score";
import { formatMatchDate, formatStage, formatStatus } from "@/lib/display";

export const dynamic = "force-dynamic";

type PlayerScoreMatch = PlayerScorePageData["matches"][number];

export default async function PlayerScorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { player, summary, matches } = await getPlayerScorePageData(id);

  return (
    <AppShell>
      <section className="space-y-3">
        <Link href="/ranking" className="text-sm font-medium text-emerald-700 hover:underline">
          Voltar para ranking
        </Link>
        <div>
          <h1 className="break-words text-2xl font-semibold text-slate-950 sm:text-3xl">
            Pontuação de {player.name}
          </h1>
          <p className="mt-1 text-slate-600">
            {summary.provisional ? "Pontuação provisória com jogos ao vivo. " : ""}
            Partidas encerradas ou ao vivo, incluindo jogos sem palpite.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={summary.provisional ? "Total provisório" : "Total de pontos"}
          value={`${summary.totalPoints} pts`}
        />
        <StatCard label="Jogos considerados" value={summary.matchesConsidered} />
        <StatCard label="Palpites enviados" value={summary.submittedPredictions} />
        <StatCard label="Sem palpite" value={summary.missingPredictions} />
        <StatCard label="Placares exatos" value={summary.exactPredictions} />
        <StatCard label="Resultados corretos" value={summary.correctResults} />
        <StatCard label="Classificados corretos" value={summary.correctAdvancingTeams} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Partidas</h2>
          <p className="text-sm text-slate-600">
            Pontuação por jogo, em ordem cronológica.
          </p>
        </div>

        {matches.length === 0 ? (
          <Card>
            <CardContent className="pt-5 text-sm text-slate-600">
              Ainda não há partidas encerradas ou ao vivo para calcular a pontuação.
            </CardContent>
          </Card>
        ) : (
          <PlayerScoreMatchesTable matches={matches} />
        )}
      </section>
    </AppShell>
  );
}

function PlayerScoreMatchesTable({ matches }: { matches: PlayerScoreMatch[] }) {
  return (
    <div className="space-y-4">
      <Card className="lg:hidden">
        <CardContent className="p-0">
          <ol className="divide-y divide-slate-100">
            {matches.map((match) => (
              <PlayerScoreMatchListItem key={match.id} match={match} />
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <caption className="sr-only">
                Pontuação por partida e total acumulado do jogador
              </caption>
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Partida</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Palpite</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Pontos</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Total até o jogo</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <PlayerScoreMatchRow key={match.id} match={match} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerScoreMatchListItem({ match }: { match: PlayerScoreMatch }) {
  const stage = match.stage as MatchStageValue;
  const status = match.status as MatchStatusValue;
  const hasOfficialScore =
    match.teamAScore !== null && match.teamBScore !== null;

  return (
    <li className="space-y-3 p-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-600">
            #{match.matchNumber} - {formatStage(stage)}
          </p>
          <StatusBadge status={status}>{formatStatus(status)}</StatusBadge>
        </div>

        <MatchScoreboard
          teamA={match.teamA}
          teamB={match.teamB}
          teamASlot={match.teamASlot}
          teamBSlot={match.teamBSlot}
          linkToTeamMatches
          teamAScore={match.teamAScore}
          teamBScore={match.teamBScore}
          size="compact"
          className="font-semibold"
        />

        <p className="text-xs text-slate-600">{formatMatchDate(match.startsAt)}</p>
        {!hasOfficialScore ? (
          <p className="text-xs text-slate-500">Placar ainda não disponível</p>
        ) : null}
        <OfficialMatchOutcome
          stage={stage}
          advancingTeam={match.advancingTeam}
          linkToTeamMatches
          className="text-xs font-normal"
        />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">Palpite</dt>
          <dd className="mt-1 min-w-0">
            <PredictionSummary match={match} />
          </dd>
        </div>

        <div className="text-right">
          <dt className="text-xs text-slate-500">
            {status === "STARTED" ? "Pontos prov." : "Pontos"}
          </dt>
          <dd className="mt-1 font-semibold tabular-nums text-slate-950">
            {match.points} pts
          </dd>
        </div>

        <div>
          <dt className="text-xs text-slate-500">Total até o jogo</dt>
          <dd className="mt-1 font-semibold tabular-nums text-slate-950">
            {match.cumulativePoints} pts
          </dd>
        </div>

        <div className="self-end text-right">
          <Link
            href={`/matches/${match.id}`}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Ver jogo
          </Link>
        </div>
      </dl>
    </li>
  );
}

function PlayerScoreMatchRow({ match }: { match: PlayerScoreMatch }) {
  const stage = match.stage as MatchStageValue;
  const status = match.status as MatchStatusValue;
  const hasOfficialScore =
    match.teamAScore !== null && match.teamBScore !== null;

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <th scope="row" className="px-4 py-3 align-top">
        <div className="space-y-1">
          <div className="max-w-md">
            <MatchScoreboard
              teamA={match.teamA}
              teamB={match.teamB}
              teamASlot={match.teamASlot}
              teamBSlot={match.teamBSlot}
              linkToTeamMatches
              teamAScore={match.teamAScore}
              teamBScore={match.teamBScore}
              size="compact"
              className="font-semibold"
            />
          </div>
          <p className="flex flex-wrap items-center gap-2 text-xs font-normal text-slate-600">
            <span>#{match.matchNumber}</span>
            <span>{formatStage(stage)}</span>
            <span>{formatMatchDate(match.startsAt)}</span>
            <StatusBadge status={status}>{formatStatus(status)}</StatusBadge>
          </p>
          {!hasOfficialScore ? (
            <p className="text-xs font-normal text-slate-500">
              Placar ainda não disponível
            </p>
          ) : null}
          <OfficialMatchOutcome
            stage={stage}
            advancingTeam={match.advancingTeam}
            linkToTeamMatches
            className="text-xs font-normal"
          />
        </div>
      </th>

      <td className="px-4 py-3 align-top">
        <PredictionSummary match={match} />
      </td>

      <td className="px-4 py-3 text-right align-top">
        <p className="font-semibold tabular-nums text-slate-950">{match.points} pts</p>
        {status === "STARTED" ? (
          <p className="text-xs text-slate-500">provisórios</p>
        ) : null}
      </td>

      <td className="px-4 py-3 text-right align-top">
        <p className="font-semibold tabular-nums text-slate-950">
          {match.cumulativePoints} pts
        </p>
      </td>

      <td className="px-4 py-3 text-right align-top">
        <Link
          href={`/matches/${match.id}`}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Ver jogo
        </Link>
      </td>
    </tr>
  );
}

function PredictionSummary({ match }: { match: PlayerScoreMatch }) {
  if (!match.prediction) {
    return <span className="text-slate-500">Sem palpite</span>;
  }

  return (
    <div>
      <p className="font-semibold tabular-nums text-slate-950">
        {match.prediction.teamAScore} x {match.prediction.teamBScore}
      </p>
      {match.prediction.predictedAdvancingTeam ? (
        <p className="mt-1 flex min-w-0 flex-wrap items-center gap-1 text-xs text-slate-600">
          <span>Classificada:</span>
          <TeamLabel
            team={match.prediction.predictedAdvancingTeam}
            linkToTeamMatches
            className="min-w-0"
            textClassName="min-w-0 break-words"
          />
        </p>
      ) : null}
    </div>
  );
}
