import Link from "next/link";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { formatMatchDate, formatStage, formatStatus, scoreText } from "@/lib/display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

type MatchCardProps = {
  match: {
    id: string;
    teamA: string;
    teamB: string;
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
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>
            {match.teamA} <span className="text-slate-400">x</span> {match.teamB}
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
          <p>Final score: <strong className="text-slate-900">{scoreText(match.teamAScore, match.teamBScore)}</strong></p>
          {prediction ? (
            <p>
              Your prediction: <strong className="text-slate-900">{prediction.teamAScore} x {prediction.teamBScore}</strong>
              {match.status === "FINISHED" ? ` (${prediction.points} pts)` : ""}
            </p>
          ) : (
            <p>No prediction submitted</p>
          )}
        </div>
        <Link href={`/matches/${match.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
          View match
        </Link>
      </CardContent>
    </Card>
  );
}
