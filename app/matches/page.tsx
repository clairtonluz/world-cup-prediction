import Link from "next/link";
import { FocusedMatches } from "@/components/matches/focused-matches";
import { AppShell } from "@/components/shared/app-shell";
import { MatchSchedule } from "@/components/matches/match-schedule";
import { MatchTeams } from "@/components/shared/match-teams";
import { MessageAlert } from "@/components/shared/message-alert";
import { getPodiumRowClassName, RankingPosition } from "@/components/ranking/ranking-position";
import { StatCard } from "@/components/stats/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMatches } from "@/lib/data/matches";
import { getRanking } from "@/lib/data/ranking";
import { getPersonalStatistics } from "@/lib/data/statistics";
import { parseMatchAgendaView } from "@/lib/match-focus";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; view?: string | string[] }>;
}) {
  const [messages, matches, ranking, statistics] = await Promise.all([
    searchParams,
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

  return (
    <AppShell>
      <MessageAlert error={messages.error} success={messages.success} />
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Jogos da Copa do Mundo 2026</h1>
        <p className="mt-1 text-slate-600">
          Jogos em horário de Brasília. Aposte antes do início dos jogos.
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
        scheduleLink={{
          href: showingCompleteAgenda ? "/matches" : "/matches?view=all",
          label: showingCompleteAgenda
            ? "Ocultar agenda completa"
            : `Ver todos os ${matches.length} jogos`,
        }}
      />
      <section className={showingCompleteAgenda ? "grid gap-6 lg:grid-cols-[2fr_1fr]" : ""}>
        {showingCompleteAgenda ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Agenda oficial - {matches.length} jogos</h2>
              <Link href="/grupos" className="text-sm font-medium text-emerald-700 hover:underline">Ver grupos</Link>
            </div>
            {matches.length ? (
              <MatchSchedule matches={matches} />
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
                    <span className="truncate">{row.name}</span>
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
                <Link key={match.id} href={`/matches/${match.id}`} className="block text-sm hover:text-emerald-700">
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <MatchTeams
                      teamA={match.teamA}
                      teamB={match.teamB}
                      teamASlot={match.teamASlot}
                      teamBSlot={match.teamBSlot}
                      className="flex-nowrap whitespace-nowrap"
                    />
                    <span>: {match.predictions[0].teamAScore} x {match.predictions[0].teamBScore}</span>
                  </span>
                </Link>
              ))}
              {recent.length === 0 ? <p className="text-sm text-slate-600">Nenhuma aposta enviada.</p> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
