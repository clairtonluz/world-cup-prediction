import Link from "next/link";
import { FocusedMatches } from "@/components/matches/focused-matches";
import { AppShell } from "@/components/shared/app-shell";
import { MatchSchedule } from "@/components/matches/match-schedule";
import { MatchTimelineFocus } from "@/components/matches/match-timeline-focus";
import { MatchTeams } from "@/components/shared/match-teams";
import { MessageAlert } from "@/components/shared/message-alert";
import { PlayerScoreLink } from "@/components/shared/player-score-link";
import { TeamLabel } from "@/components/shared/team-label";
import { getPodiumRowClassName, RankingPosition } from "@/components/ranking/ranking-position";
import { StatCard } from "@/components/stats/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMatches } from "@/lib/data/matches";
import { getRanking } from "@/lib/data/ranking";
import { getPersonalStatistics } from "@/lib/data/statistics";
import {
  parseMatchAgendaView,
  selectCurrentOrNextMatch,
  selectTeamTimelineFocusMatch,
} from "@/lib/match-focus";
import { parseTeamSearchParam } from "@/lib/team-matches";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TEAM_TIMELINE_FOCUS_ID = "team-timeline-focus-match";
const MATCH_AGENDA_FOCUS_ID = "match-agenda-focus-match";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    team?: string | string[];
    view?: string | string[];
  }>;
}) {
  const messages = await searchParams;
  const selectedTeam = parseTeamSearchParam(messages.team);

  if (selectedTeam) {
    const matches = await listMatches();
    return (
      <TeamMatchesPage
        error={messages.error}
        success={messages.success}
        matches={matches}
        selectedTeam={selectedTeam}
      />
    );
  }

  const [matches, ranking, statistics] = await Promise.all([
    listMatches(),
    getRanking(),
    getPersonalStatistics(),
  ]);
  const recent = matches
    .filter((match) => match.predictions.length > 0)
    .slice(-3)
    .reverse();
  const agendaView = parseMatchAgendaView(messages.view);
  const showingCompleteAgenda = agendaView === "all";
  const focusedAgendaMatch = showingCompleteAgenda
    ? selectCurrentOrNextMatch(matches)
    : null;

  return (
    <AppShell>
      <MessageAlert error={messages.error} success={messages.success} />
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Jogos da Copa do Mundo 2026</h1>
        <p className="mt-1 text-slate-600">
          Jogos no horário do seu navegador. Aposte antes do início dos jogos.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Minha posição global"
          value={
            ranking.currentUser ? (
              <RankingPosition position={ranking.currentUser.position} />
            ) : (
              "-"
            )
          }
        />
        <StatCard label={statistics.provisional ? "Pontos provisórios" : "Total de pontos"} value={statistics.totalPoints} />
        <StatCard label="Precisão das apostas" value={`${statistics.accuracy}%`} />
      </section>
      <FocusedMatches
        matches={matches}
        referenceTime={new Date()}
        scheduleLink={{
          href: showingCompleteAgenda ? "/matches" : "/matches?view=all",
          label: showingCompleteAgenda
            ? "Ocultar agenda completa"
            : `Ver todos os ${matches.length} jogos`,
          scroll: showingCompleteAgenda ? undefined : false,
        }}
      />
      <MatchTimelineFocus
        targetId={focusedAgendaMatch ? MATCH_AGENDA_FOCUS_ID : null}
      />
      <section className={showingCompleteAgenda ? "grid gap-6 lg:grid-cols-[2fr_1fr]" : ""}>
        {showingCompleteAgenda ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Agenda oficial - {matches.length} jogos</h2>
              <Link href="/grupos" className="text-sm font-medium text-emerald-700 hover:underline">Ver grupos</Link>
            </div>
            {matches.length ? (
              <MatchSchedule
                matches={matches}
                focusedMatchId={focusedAgendaMatch?.id}
                focusedMatchElementId={MATCH_AGENDA_FOCUS_ID}
              />
            ) : (
              <Card><CardContent className="pt-5 text-sm text-slate-600">Nenhum jogo disponível.</CardContent></Card>
            )}
          </div>
        ) : null}
        <div className={showingCompleteAgenda ? "space-y-5" : "grid gap-5 lg:grid-cols-2"}>
          <Card>
            <CardHeader>
              <CardTitle>{ranking.provisional ? "Ranking global provisório" : "Prévia do ranking global"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ranking.rows.slice(0, 5).map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm",
                    getPodiumRowClassName(row.position),
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <RankingPosition position={row.position} className="shrink-0" />
                    <PlayerScoreLink
                      playerId={row.id}
                      name={row.name}
                      className="truncate text-slate-950"
                    />
                  </span>
                  <strong className="shrink-0">{row.totalPoints} pts</strong>
                </div>
              ))}
              {ranking.rows.length === 0 ? <p className="text-sm text-slate-600">Nenhum participante no ranking.</p> : null}
              <Link href="/ranking" className="block text-sm font-medium text-emerald-700 hover:underline">
                Ver ranking global completo
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Apostas recentes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {recent.map((match) => (
                <div
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
                    <MatchTeams
                      teamA={match.teamA}
                      teamB={match.teamB}
                      teamASlot={match.teamASlot}
                      teamBSlot={match.teamBSlot}
                      linkToTeamMatches
                      className="flex-nowrap whitespace-nowrap"
                    />
                    <span>: {match.predictions[0].teamAScore} x {match.predictions[0].teamBScore}</span>
                  </span>
                  <Link
                    href={`/matches/${match.id}`}
                    className="shrink-0 font-medium text-emerald-700 hover:underline"
                  >
                    Ver jogo
                  </Link>
                </div>
              ))}
              {recent.length === 0 ? <p className="text-sm text-slate-600">Nenhuma aposta enviada.</p> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

function TeamMatchesPage({
  error,
  success,
  matches,
  selectedTeam,
}: {
  error?: string;
  success?: string;
  matches: Awaited<ReturnType<typeof listMatches>>;
  selectedTeam: string;
}) {
  const teamMatches = matches.filter(
    (match) => match.teamA === selectedTeam || match.teamB === selectedTeam,
  );
  const focusedMatch = selectTeamTimelineFocusMatch(teamMatches);

  return (
    <AppShell>
      <MessageAlert error={error} success={success} />
      <section className="space-y-3">
        <Link href="/matches" className="text-sm font-medium text-emerald-700 hover:underline">
          Voltar para todos os jogos
        </Link>
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-3xl font-semibold text-slate-950">
            <span>Jogos do</span>
            <TeamLabel
              team={selectedTeam}
              className="min-w-0"
              textClassName="min-w-0 break-words"
            />
          </h1>
          <p className="mt-1 text-slate-600">
            Partidas em ordem cronológica, com destaque para o jogo atual ou o próximo compromisso.
          </p>
        </div>
      </section>

      <MatchTimelineFocus
        targetId={focusedMatch ? TEAM_TIMELINE_FOCUS_ID : null}
      />

      {teamMatches.length > 0 ? (
        <MatchSchedule
          matches={teamMatches}
          focusedMatchId={focusedMatch?.id}
          focusedMatchElementId={TEAM_TIMELINE_FOCUS_ID}
        />
      ) : (
        <Card>
          <CardContent className="pt-5 text-sm text-slate-600">
            Nenhum jogo encontrado para {selectedTeam}.
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
