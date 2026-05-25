import { MATCH_STAGES, MATCH_STATUSES, STAGE_LABELS, STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MatchValues = {
  teamA: string;
  teamB: string;
  stage: string;
  startsAt: Date;
  status: string;
  teamAScore: number | null;
  teamBScore: number | null;
};

export function MatchForm({
  action,
  match,
  fixtureLocked = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  match?: MatchValues;
  fixtureLocked?: boolean;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="teamA">Team A</Label>
          <Input id="teamA" name="teamA" defaultValue={match?.teamA} readOnly={fixtureLocked} required />
        </div>
        <div>
          <Label htmlFor="teamB">Team B</Label>
          <Input id="teamB" name="teamB" defaultValue={match?.teamB} readOnly={fixtureLocked} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="stage">Stage</Label>
          {fixtureLocked ? <input type="hidden" name="stage" value={match?.stage} /> : null}
          <select
            id="stage"
            name="stage"
            defaultValue={match?.stage ?? "GROUP_STAGE"}
            disabled={fixtureLocked}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            {MATCH_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="startsAt">Kickoff (ISO date/time with timezone)</Label>
          <Input
            id="startsAt"
            name="startsAt"
            defaultValue={match?.startsAt.toISOString()}
            placeholder="2026-06-15T19:00:00-03:00"
            readOnly={fixtureLocked}
            required
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={match?.status ?? "SCHEDULED"}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            {MATCH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {fixtureLocked ? (
        <p className="text-sm text-slate-600">
          Teams, stage, and kickoff are locked after predictions close.
        </p>
      ) : null}
      <p className="text-sm text-slate-600">
        Enter final scores when changing status to Finished. Scores are ignored for other statuses.
      </p>
      <div className="grid max-w-sm grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <Label htmlFor="teamAScore">Team A final score</Label>
          <Input id="teamAScore" name="teamAScore" type="number" min={0} max={99} defaultValue={match?.teamAScore ?? ""} />
        </div>
        <span className="pb-3">x</span>
        <div>
          <Label htmlFor="teamBScore">Team B final score</Label>
          <Input id="teamBScore" name="teamBScore" type="number" min={0} max={99} defaultValue={match?.teamBScore ?? ""} />
        </div>
      </div>
      <Button type="submit">{match ? "Save match" : "Create match"}</Button>
    </form>
  );
}
