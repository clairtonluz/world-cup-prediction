import type { ChampionFavoriteRow } from "@/lib/ranking";
import { TeamLabel } from "@/components/shared/team-label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ChampionFavoritesCard({
  favorites,
}: {
  favorites: ChampionFavoriteRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Favoritos ao título</CardTitle>
        <p className="text-sm text-slate-600">
          Percentual entre participantes que já escolheram um campeão.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {favorites.length > 0 ? (
          favorites.map((favorite) => (
            <div key={favorite.team} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <TeamLabel team={favorite.team} className="min-w-0 font-medium text-slate-950" />
                <span className="shrink-0 text-slate-600">
                  {favorite.percentage}% - {favorite.predictionCount}{" "}
                  {favorite.predictionCount === 1 ? "palpite" : "palpites"}
                </span>
              </div>
              <Progress
                value={favorite.percentage}
                ariaLabel={`${favorite.team}: ${favorite.percentage}% dos palpites de campeão`}
              />
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-600">
            Nenhum palpite de campeão registrado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
