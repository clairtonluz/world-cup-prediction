import {
  updateFavoriteTeamAction,
  updatePredictedChampionAction,
} from "@/actions/profile-actions";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { StatCard } from "@/components/stats/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { getPersonalStatistics } from "@/lib/data/statistics";
import { getChampionPredictionFormData } from "@/lib/data/tournament-predictions";
import { formatMatchDate } from "@/lib/display";
import { CHAMPION_BONUS_POINTS } from "@/lib/tournament-predictions";

export const dynamic = "force-dynamic";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [messages, stats, championPrediction] = await Promise.all([
    searchParams,
    getPersonalStatistics(),
    getChampionPredictionFormData(),
  ]);
  return (
    <AppShell>
      <h1 className="text-3xl font-semibold text-slate-950">Minhas estatísticas</h1>
      <MessageAlert {...messages} />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={stats.provisional ? "Pontos provisórios" : "Total de pontos"} value={stats.totalPoints} />
        <StatCard label="Placares exatos" value={stats.exactPredictions} />
        <StatCard label="Resultados corretos" value={stats.correctResults} />
        <StatCard label="Classificados certos" value={stats.correctAdvancingTeams} />
        <StatCard label="Jogos apostados" value={stats.totalPredictions} />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Precisão</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{stats.accuracy}%</p>
            <Progress value={stats.accuracy} />
            <p className="text-sm text-slate-600">
              Baseada em {stats.scoredPredictions} apostas pontuadas
              {stats.provisional ? ", incluindo placares ao vivo." : "."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Destaques</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Time favorito: <strong>{stats.favoriteTeam ?? "Não selecionado"}</strong></p>
            <p>
              Campeão previsto:{" "}
              <strong>{stats.predictedChampion ?? "Não selecionado"}</strong>
              {stats.championPredictionCorrect ? ` (+${stats.championBonusPoints} pts)` : ""}
            </p>
            <p>Melhor fase: <strong>{stats.bestStage ? `${stats.bestStage.label} (${stats.bestStage.points} pts)` : "Nenhuma aposta pontuada"}</strong></p>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Palpite do campeão</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-slate-600">
              Acertar o campeão da Copa vale <strong>{CHAMPION_BONUS_POINTS} pontos</strong>.
              {championPrediction.closesAt
                ? ` O palpite pode ser alterado antes de ${formatMatchDate(championPrediction.closesAt)}.`
                : ""}
            </p>
            {championPrediction.editable ? (
              <form action={updatePredictedChampionAction} className="space-y-4">
                <div>
                  <Label htmlFor="predictedChampion">Seleção campeã</Label>
                  <select
                    id="predictedChampion"
                    name="predictedChampion"
                    defaultValue={championPrediction.predictedChampion ?? ""}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#0e74e1] focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Sem palpite</option>
                    {championPrediction.teams.map((team) => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit">Salvar palpite</Button>
              </form>
            ) : (
              <p className="rounded-lg bg-slate-100 p-4 text-slate-700">
                {championPrediction.predictedChampion
                  ? `Palpite registrado: ${championPrediction.predictedChampion}.`
                  : "Nenhum palpite de campeão foi registrado antes do prazo."}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Time favorito</CardTitle></CardHeader>
          <CardContent>
            <form action={updateFavoriteTeamAction} className="space-y-4">
              <div>
                <Label htmlFor="favoriteTeam">Nome da equipe</Label>
                <Input id="favoriteTeam" name="favoriteTeam" defaultValue={stats.favoriteTeam ?? ""} placeholder="Brasil" maxLength={80} />
              </div>
              <Button type="submit">Salvar preferência</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
