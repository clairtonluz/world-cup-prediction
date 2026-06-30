import Link from "next/link";
import { MatchStatusIndicator } from "@/components/matches/match-status-indicator";
import { AppShell } from "@/components/shared/app-shell";
import { MatchScoreboard } from "@/components/shared/match-scoreboard";
import { OfficialMatchOutcome } from "@/components/shared/official-match-outcome";
import { TeamLabel } from "@/components/shared/team-label";
import { StatCard } from "@/components/stats/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { getPlayerScorePageData, type PlayerScorePageData } from "@/lib/data/player-score";
import { formatMatchDate, formatStage } from "@/lib/display";

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
          <h1 className="text-3xl font-semibold text-slate-950">
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
          <div className="space-y-4">
            {matches.map((match) => (
              <PlayerScoreMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function PlayerScoreMatchCard({ match }: { match: PlayerScoreMatch }) {
  const stage = match.stage as MatchStageValue;
  const status = match.status as MatchStatusValue;
  const hasOfficialScore =
    match.teamAScore !== null && match.teamBScore !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>
            <MatchScoreboard
              teamA={match.teamA}
              teamB={match.teamB}
              teamASlot={match.teamASlot}
              teamBSlot={match.teamBSlot}
              linkToTeamMatches
              teamAScore={match.teamAScore}
              teamBScore={match.teamBScore}
              size="compact"
              className="text-base font-semibold sm:text-lg"
            />
          </CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Jogo #{match.matchNumber} - {formatStage(stage)} - {formatMatchDate(match.startsAt)}
          </p>
        </div>
        <MatchStatusIndicator status={status} startsAt={match.startsAt} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-slate-500">Resultado oficial</p>
            <p className="font-semibold text-slate-950">
              {hasOfficialScore
                ? `${match.teamAScore} x ${match.teamBScore}`
                : "Placar ainda não disponível"}
            </p>
            <OfficialMatchOutcome
              stage={stage}
              advancingTeam={match.advancingTeam}
              linkToTeamMatches
              className="mt-2"
            />
          </div>

          <div>
            <p className="text-slate-500">Palpite</p>
            {match.prediction ? (
              <>
                <p className="font-semibold text-slate-950">
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
              </>
            ) : (
              <p className="font-semibold text-slate-950">Sem palpite</p>
            )}
          </div>

          <div>
            <p className="text-slate-500">
              {status === "STARTED" ? "Pontos provisórios" : "Pontos"}
            </p>
            <p className="font-semibold text-slate-950">{match.points} pts</p>
          </div>
        </div>

        <Link
          href={`/matches/${match.id}`}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Ver jogo
        </Link>
      </CardContent>
    </Card>
  );
}
