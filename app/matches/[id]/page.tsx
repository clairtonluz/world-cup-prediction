import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { PredictionForm } from "@/components/matches/prediction-form";
import { PredictionsTable } from "@/components/matches/predictions-table";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { getMatchDetail } from "@/lib/data/matches";
import { formatMatchDate, formatStage, formatStatus, scoreText } from "@/lib/display";
import { hasEffectivelyStarted } from "@/lib/match-rules";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const match = await getMatchDetail(id);
  const prediction = match.predictions[0];
  const started = hasEffectivelyStarted({
    startsAt: match.startsAt,
    status: match.status as MatchStatusValue,
  });

  return (
    <AppShell>
      <Link href="/matches" className="text-sm font-medium text-emerald-700 hover:underline">
        Back to matches
      </Link>
      <MessageAlert {...messages} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row justify-between gap-4">
            <div>
              <CardTitle>{match.teamA} x {match.teamB}</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                {formatStage(match.stage as MatchStageValue)} - {formatMatchDate(match.startsAt)}
              </p>
            </div>
            <StatusBadge status={match.status as MatchStatusValue}>
              {formatStatus(match.status as MatchStatusValue)}
            </StatusBadge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Final score: <strong className="text-slate-950">{scoreText(match.teamAScore, match.teamBScore)}</strong>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Your prediction</CardTitle></CardHeader>
          <CardContent>
            <PredictionForm
              matchId={match.id}
              teamA={match.teamA}
              teamB={match.teamB}
              prediction={prediction}
              disabled={started}
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Friends&apos; predictions</CardTitle></CardHeader>
        <CardContent>
          <PredictionsTable predictions={match.comparisonPredictions} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
