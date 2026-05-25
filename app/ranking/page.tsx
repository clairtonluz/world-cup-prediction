import { AppShell } from "@/components/shared/app-shell";
import { RankingTable } from "@/components/ranking/ranking-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRanking } from "@/lib/data/ranking";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const ranking = await getRanking();
  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Ranking</h1>
        <p className="mt-1 text-slate-600">Standings use points, exact scores, correct winners, then name.</p>
      </section>
      {ranking.currentUser ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">Current Position</p><p className="text-3xl font-semibold">#{ranking.currentUser.position}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">Total Points</p><p className="text-3xl font-semibold">{ranking.currentUser.totalPoints}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">Exact Predictions</p><p className="text-3xl font-semibold">{ranking.currentUser.exactPredictions}</p></CardContent></Card>
        </div>
      ) : null}
      <Card>
        <CardHeader><CardTitle>All participants</CardTitle></CardHeader>
        <CardContent><RankingTable rows={ranking.rows} /></CardContent>
      </Card>
    </AppShell>
  );
}
