import Link from "next/link";
import { MatchStatusIndicator } from "@/components/matches/match-status-indicator";
import { MatchTeams } from "@/components/shared/match-teams";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { formatMatchDate, formatStage, scoreText } from "@/lib/display";
import { mayEditPrediction } from "@/lib/match-rules";
import { cn } from "@/lib/utils";

export type MatchCardMatch = {
  id: string;
  teamA: string | null;
  teamB: string | null;
  teamASlot: string | null;
  teamBSlot: string | null;
  participantsConfirmed: boolean;
  stage: string;
  startsAt: Date;
  status: string;
  teamAScore: number | null;
  teamBScore: number | null;
  predictions?: { teamAScore: number; teamBScore: number; points: number }[];
};

type MatchCardProps = {
  match: MatchCardMatch;
  highlighted?: boolean;
};

export function MatchCard({ match, highlighted = false }: MatchCardProps) {
  const prediction = match.predictions?.[0];
  const status = match.status as MatchStatusValue;
  const editable = mayEditPrediction({
    startsAt: match.startsAt,
    status,
    participantsConfirmed: match.participantsConfirmed,
  });
  const actionLabel = editable
    ? prediction
      ? "Editar aposta"
      : "Fazer aposta"
    : "Ver jogo";

  return (
    <Card
      className={cn(
        highlighted && "border-emerald-300 bg-white shadow-emerald-950/[0.08]",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>
            <MatchTeams
              teamA={match.teamA}
              teamB={match.teamB}
              teamASlot={match.teamASlot}
              teamBSlot={match.teamBSlot}
            />
          </CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            {formatStage(match.stage as MatchStageValue)} - {formatMatchDate(match.startsAt)}
          </p>
        </div>
        <MatchStatusIndicator
          status={status}
          startsAt={match.startsAt}
        />
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          <p>
            {status === "STARTED" ? "Placar ao vivo" : "Placar"}:{" "}
            <strong className="text-slate-900">
              {scoreText(match.teamAScore, match.teamBScore)}
            </strong>
          </p>
          {prediction ? (
            <p>
              Sua aposta: <strong className="text-slate-900">{prediction.teamAScore} x {prediction.teamBScore}</strong>
              {match.status !== "SCHEDULED" ? ` (${prediction.points} pts)` : ""}
            </p>
          ) : (
            <p>Nenhuma aposta enviada</p>
          )}
        </div>
        <Link
          href={`/matches/${match.id}`}
          className={buttonVariants({
            variant: editable ? "default" : "outline",
            size: "sm",
          })}
        >
          {actionLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
