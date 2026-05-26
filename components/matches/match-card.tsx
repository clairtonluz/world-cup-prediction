import Link from "next/link";
import { MatchTeams } from "@/components/shared/match-teams";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { formatMatchDate, formatStage, formatStatus, scoreText } from "@/lib/display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

type MatchCardProps = {
  match: {
    id: string;
    teamA: string | null;
    teamB: string | null;
    teamASlot: string | null;
    teamBSlot: string | null;
    stage: string;
    startsAt: Date;
    status: string;
    teamAScore: number | null;
    teamBScore: number | null;
    predictions?: { teamAScore: number; teamBScore: number; points: number }[];
  };
};

export function MatchCard({ match }: MatchCardProps) {
  const prediction = match.predictions?.[0];
  return (
    <Card>
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
        <StatusBadge status={match.status as MatchStatusValue}>
          {formatStatus(match.status as MatchStatusValue)}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          <p>Placar: <strong className="text-slate-900">{scoreText(match.teamAScore, match.teamBScore)}</strong></p>
          {prediction ? (
            <p>
              Sua aposta: <strong className="text-slate-900">{prediction.teamAScore} x {prediction.teamBScore}</strong>
              {match.status !== "SCHEDULED" ? ` (${prediction.points} pts)` : ""}
            </p>
          ) : (
            <p>Nenhuma aposta enviada</p>
          )}
        </div>
        <Link href={`/matches/${match.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
          Ver jogo
        </Link>
      </CardContent>
    </Card>
  );
}
