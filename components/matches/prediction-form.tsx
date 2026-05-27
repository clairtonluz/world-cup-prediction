import { savePredictionAction } from "@/actions/prediction-actions";
import { TeamLabel } from "@/components/shared/team-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MatchStageValue } from "@/lib/constants";
import { requiresAdvancingTeamPrediction } from "@/lib/tournament-predictions";

export function PredictionForm({
  matchId,
  teamA,
  teamB,
  stage,
  teamASlot,
  teamBSlot,
  prediction,
  disabled,
  disabledReason,
  returnTo = "match",
  fieldIdPrefix,
}: {
  matchId: string;
  teamA: string | null;
  teamB: string | null;
  stage: MatchStageValue;
  teamASlot?: string | null;
  teamBSlot?: string | null;
  prediction?: {
    teamAScore: number;
    teamBScore: number;
    predictedAdvancingTeam: string | null;
  };
  disabled: boolean;
  disabledReason?: string;
  returnTo?: "match" | "apostas";
  fieldIdPrefix?: string;
}) {
  const requestsAdvancingTeam = requiresAdvancingTeamPrediction(stage);
  const teamAScoreId = fieldIdPrefix ? `${fieldIdPrefix}-teamAScore` : "teamAScore";
  const teamBScoreId = fieldIdPrefix ? `${fieldIdPrefix}-teamBScore` : "teamBScore";
  const advancingTeamId = fieldIdPrefix
    ? `${fieldIdPrefix}-predictedAdvancingTeam`
    : "predictedAdvancingTeam";

  if (disabled) {
    return (
      <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
        {disabledReason ?? "As apostas estão encerradas porque o jogo já começou."}
      </p>
    );
  }

  return (
    <form action={savePredictionAction} className="space-y-4">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <Label htmlFor={teamAScoreId}>
            <TeamLabel team={teamA} slot={teamASlot} />
          </Label>
          <Input
            id={teamAScoreId}
            name="teamAScore"
            type="number"
            min={0}
            max={99}
            defaultValue={prediction?.teamAScore}
            required
          />
        </div>
        <span className="pb-3 text-slate-500">x</span>
        <div>
          <Label htmlFor={teamBScoreId}>
            <TeamLabel team={teamB} slot={teamBSlot} />
          </Label>
          <Input
            id={teamBScoreId}
            name="teamBScore"
            type="number"
            min={0}
            max={99}
            defaultValue={prediction?.teamBScore}
            required
          />
        </div>
      </div>
      {requestsAdvancingTeam ? (
        <div>
          <Label htmlFor={advancingTeamId}>Equipe classificada</Label>
          <select
            id={advancingTeamId}
            name="predictedAdvancingTeam"
            defaultValue={prediction?.predictedAdvancingTeam ?? ""}
            required
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#0e74e1] focus:ring-2 focus:ring-blue-100"
          >
            <option value="" disabled>Selecione quem avança</option>
            {teamA ? <option value={teamA}>{teamA}</option> : null}
            {teamB ? <option value={teamB}>{teamB}</option> : null}
          </select>
          <p className="mt-1 text-sm text-slate-600">
            Em caso de empate no placar previsto, informe quem avança.
          </p>
        </div>
      ) : null}
      <Button type="submit">{prediction ? "Atualizar aposta" : "Salvar aposta"}</Button>
    </form>
  );
}
