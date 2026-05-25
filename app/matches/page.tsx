import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { MatchCard } from "@/components/matches/match-card";
import { MessageAlert } from "@/components/shared/message-alert";
import { StatCard } from "@/components/stats/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMatches } from "@/lib/data/matches";
import { getRanking } from "@/lib/data/ranking";
import { getPersonalStatistics } from "@/lib/data/statistics";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [messages, matches, ranking, statistics] = await Promise.all([
    searchParams,
    listMatches(),
    getRanking(),
    getPersonalStatistics(),
  ]);
  const upcoming = matches.filter((match) => match.status !== "FINISHED");
  const recent = matches
    .filter((match) => match.predictions.length > 0)
    .slice(-3)
    .reverse();

  return (
    <AppShell>
      <MessageAlert {...messages} />
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Matches</h1>
        <p className="mt-1 text-slate-600">Submit predictions before kickoff and track the pool.</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My Position" value={ranking.currentUser ? `#${ranking.currentUser.position}` : "-"} />
        <StatCard label="Total Points" value={statistics.totalPoints} />
        <StatCard label="Prediction Accuracy" value={`${statistics.accuracy}%`} />
      </section>
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming matches</h2>
            <Link href="/ranking" className="text-sm font-medium text-emerald-700 hover:underline">Full ranking</Link>
          </div>
          {upcoming.length ? (
            upcoming.map((match) => <MatchCard key={match.id} match={match} />)
          ) : (
            <Card><CardContent className="pt-5 text-sm text-slate-600">No upcoming matches.</CardContent></Card>
          )}
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Ranking preview</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ranking.rows.slice(0, 5).map((row) => (
                <div key={row.id} className="flex justify-between text-sm">
                  <span>#{row.position} {row.name}</span>
                  <strong>{row.totalPoints} pts</strong>
                </div>
              ))}
              {ranking.rows.length === 0 ? <p className="text-sm text-slate-600">No ranked players yet.</p> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent predictions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {recent.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`} className="block text-sm hover:text-emerald-700">
                  {match.teamA} x {match.teamB}: {match.predictions[0].teamAScore} x {match.predictions[0].teamBScore}
                </Link>
              ))}
              {recent.length === 0 ? <p className="text-sm text-slate-600">No predictions yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
