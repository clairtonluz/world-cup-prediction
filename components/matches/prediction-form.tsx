import { savePredictionAction } from "@/actions/prediction-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PredictionForm({
  matchId,
  teamA,
  teamB,
  prediction,
  disabled,
}: {
  matchId: string;
  teamA: string;
  teamB: string;
  prediction?: { teamAScore: number; teamBScore: number };
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
        Predictions are closed because this match has started.
      </p>
    );
  }

  return (
    <form action={savePredictionAction} className="space-y-4">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <Label htmlFor="teamAScore">{teamA}</Label>
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
          <Label htmlFor="teamBScore">{teamB}</Label>
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
      <Button type="submit">{prediction ? "Update prediction" : "Save prediction"}</Button>
    </form>
  );
}
