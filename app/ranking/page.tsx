import { AppShell } from "@/components/shared/app-shell";
import { ChampionFavoritesCard } from "@/components/ranking/champion-favorites-card";
import { RankingPosition } from "@/components/ranking/ranking-position";
import { RankingTable } from "@/components/ranking/ranking-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRanking } from "@/lib/data/ranking";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const ranking = await getRanking();
  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Ranking global</h1>
        <p className="mt-1 text-slate-600">
          {ranking.provisional ? "Classificação provisória com jogos ao vivo. " : ""}
          Desempates por pontos, placares exatos, resultados corretos,
          classificados no mata-mata e campeão da Copa.
        </p>
      </section>
      {ranking.currentUser ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">Minha posição</p><p className="mt-2"><RankingPosition position={ranking.currentUser.position} size="featured" /></p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">{ranking.provisional ? "Pontos provisórios" : "Total de pontos"}</p><p className="text-3xl font-semibold">{ranking.currentUser.totalPoints}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">Placares exatos</p><p className="text-3xl font-semibold">{ranking.currentUser.exactPredictions}</p></CardContent></Card>
        </div>
      ) : null}
      <ChampionFavoritesCard favorites={ranking.championFavorites} />
      <Card>
        <CardHeader><CardTitle>Todos os participantes</CardTitle></CardHeader>
        <CardContent>
          <RankingTable
            rows={ranking.rows}
            showPredictedChampion={ranking.championPredictionsVisible}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
