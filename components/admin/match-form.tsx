import { MATCH_STATUSES, STATUS_LABELS, type MatchStageValue } from "@/lib/constants";
import { formatMatchDate, formatStage } from "@/lib/display";
import { MatchTeams } from "@/components/shared/match-teams";
import { TeamLabel } from "@/components/shared/team-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MatchValues = {
  matchNumber: number;
  teamA: string | null;
  teamB: string | null;
  teamASlot: string | null;
  teamBSlot: string | null;
  stage: string;
  startsAt: Date;
  venue: string;
  hostCity: string;
  status: string;
  teamAScore: number | null;
  teamBScore: number | null;
  advancingTeam: string | null;
};

export function MatchForm({
  action,
  match,
}: {
  action: (formData: FormData) => void | Promise<void>;
  match: MatchValues;
}) {
  const isKnockout = match.stage !== "GROUP_STAGE";

  return (
    <form action={action} className="space-y-5">
      <dl className="grid gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Confronto oficial</dt>
          <dd className="font-medium text-slate-950">
            <span className="mr-2">Jogo {match.matchNumber}:</span>
            <MatchTeams
              teamA={match.teamA}
              teamB={match.teamB}
              teamASlot={match.teamASlot}
              teamBSlot={match.teamBSlot}
            />
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Fase e horário</dt>
          <dd className="font-medium text-slate-950">
            {formatStage(match.stage as MatchStageValue)} - {formatMatchDate(match.startsAt)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Local</dt>
          <dd className="font-medium text-slate-950">
            {match.venue}, {match.hostCity}
          </dd>
        </div>
      </dl>
      <p className="text-sm text-slate-600">
        A agenda, as equipes de origem, a fase, o horário e o local são fixos.
        Confrontos futuros são preenchidos automaticamente pelos resultados.
      </p>
      <div className="max-w-xs">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={match.status}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#0e74e1] focus:ring-2 focus:ring-blue-100"
        >
          {MATCH_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-slate-600">
        Durante um jogo ao vivo, informe o placar parcial para recalcular pontos
        provisórios. Ao encerrar, o placar passa a ser definitivo.
      </p>
      <div className="grid max-w-sm grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <Label htmlFor="teamAScore">
            <TeamLabel team={match.teamA} slot={match.teamASlot} />
          </Label>
          <Input
            id="teamAScore"
            name="teamAScore"
            type="number"
            min={0}
            max={99}
            defaultValue={match.teamAScore ?? ""}
          />
        </div>
        <span className="pb-3">x</span>
        <div>
          <Label htmlFor="teamBScore">
            <TeamLabel team={match.teamB} slot={match.teamBSlot} />
          </Label>
          <Input
            id="teamBScore"
            name="teamBScore"
            type="number"
            min={0}
            max={99}
            defaultValue={match.teamBScore ?? ""}
          />
        </div>
      </div>
      {isKnockout && match.teamA && match.teamB ? (
        <div className="max-w-sm">
          <Label htmlFor="advancingTeam">
            Classificado em caso de empate no placar final
          </Label>
          <select
            id="advancingTeam"
            name="advancingTeam"
            defaultValue={match.advancingTeam ?? ""}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#0e74e1] focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Selecione somente se houver empate</option>
            <option value={match.teamA}>{match.teamA}</option>
            <option value={match.teamB}>{match.teamB}</option>
          </select>
        </div>
      ) : null}
      <Button type="submit">Salvar resultado</Button>
    </form>
  );
}
