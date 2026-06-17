import { FocusedMatches } from "@/components/matches/focused-matches";
import { ChampionPredictionCard } from "@/components/predictions/champion-prediction-card";
import { PersonalPredictionsList } from "@/components/predictions/personal-predictions-list";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { StatCard } from "@/components/stats/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMatches } from "@/lib/data/matches";
import { listPersonalPredictions } from "@/lib/data/predictions";
import { getPersonalStatistics } from "@/lib/data/statistics";
import { getChampionPredictionFormData } from "@/lib/data/tournament-predictions";

export const dynamic = "force-dynamic";

export default async function PersonalPredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [messages, matches, predictions, statistics, championPrediction] = await Promise.all([
    searchParams,
    listMatches(),
    listPersonalPredictions(),
    getPersonalStatistics(),
    getChampionPredictionFormData(),
  ]);

  return (
    <AppShell>
      <MessageAlert error={messages.error} success={messages.success} />
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Minhas apostas</h1>
        <p className="mt-1 text-slate-600">
          Acompanhe seus palpites, resultados e pontos em cada fase da Copa.
        </p>
      </section>

      <ChampionPredictionCard
        championPrediction={championPrediction}
        returnTo="apostas"
        featured
      />

      <FocusedMatches
        matches={matches}
        title="Jogos em foco para apostar"
        description="Veja rapidamente os jogos de hoje e as próximas apostas disponíveis."
        scheduleLink={{
          href: "/matches?view=all",
          label: "Ver agenda completa",
          scroll: false,
        }}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={statistics.provisional ? "Pontos em jogos (provisórios)" : "Pontos em jogos"}
          value={statistics.gamePoints}
        />
        <StatCard label="Bônus de campeão" value={statistics.championBonusPoints} />
        <StatCard
          label={statistics.provisional ? "Total geral provisório" : "Total geral"}
          value={statistics.totalPoints}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pontos por fase</CardTitle>
          <p className="text-sm text-slate-600">
            {statistics.provisional
              ? "Totais incluindo resultados de jogos ao vivo."
              : "Totais confirmados conforme os resultados disponíveis."}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.stagePoints.map((stage) => (
              <div key={stage.stage} className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">{stage.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {stage.points} pts
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PersonalPredictionsList predictions={predictions} />
    </AppShell>
  );
}
