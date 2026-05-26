import { savePredictionAction } from "@/actions/prediction-actions";
import { TeamLabel } from "@/components/shared/team-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PredictionForm({
  matchId,
  teamA,
  teamB,
  teamASlot,
  teamBSlot,
  prediction,
  disabled,
  disabledReason,
}: {
  matchId: string;
  teamA: string | null;
  teamB: string | null;
  teamASlot?: string | null;
  teamBSlot?: string | null;
  prediction?: { teamAScore: number; teamBScore: number };
  disabled: boolean;
  disabledReason?: string;
}) {
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <Label htmlFor="teamAScore">
            <TeamLabel team={teamA} slot={teamASlot} />
          </Label>
          <Input
            id="teamAScore"
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
          <Label htmlFor="teamBScore">
            <TeamLabel team={teamB} slot={teamBSlot} />
          </Label>
          <Input
            id="teamBScore"
            name="teamBScore"
            type="number"
            min={0}
            max={99}
            defaultValue={prediction?.teamBScore}
            required
          />
        </div>
      </div>
      <Button type="submit">{prediction ? "Atualizar aposta" : "Salvar aposta"}</Button>
    </form>
  );
}
