import { updatePredictedChampionAction } from "@/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatMatchDate } from "@/lib/display";
import { CHAMPION_BONUS_POINTS } from "@/lib/tournament-predictions";

type ChampionPredictionFormData = {
  predictedChampion: string | null;
  teams: string[];
  editable: boolean;
  closesAt: Date | null;
};

export function ChampionPredictionCard({
  championPrediction,
  returnTo,
  featured = false,
}: {
  championPrediction: ChampionPredictionFormData;
  returnTo: "me" | "apostas";
  featured?: boolean;
}) {
  return (
    <Card
      className={
        featured
          ? "border-[#0e74e1]/35 bg-gradient-to-br from-white to-blue-50/60 shadow-blue-950/[0.08]"
          : undefined
      }
    >
      <CardHeader>
        <CardTitle>Palpite do campeão</CardTitle>
        <p className="text-sm text-slate-600">
          Acertar o campeão da Copa vale <strong>{CHAMPION_BONUS_POINTS} pontos</strong>.
          {championPrediction.closesAt
            ? ` O palpite pode ser alterado antes de ${formatMatchDate(championPrediction.closesAt)}.`
            : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {championPrediction.editable ? (
          <form action={updatePredictedChampionAction} className="space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div>
              <Label htmlFor={`predictedChampion-${returnTo}`}>Seleção campeã</Label>
              <select
                id={`predictedChampion-${returnTo}`}
                name="predictedChampion"
                defaultValue={championPrediction.predictedChampion ?? ""}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#0e74e1] focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Sem palpite</option>
                {championPrediction.teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
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
  );
}
