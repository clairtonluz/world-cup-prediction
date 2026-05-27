import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { MatchTeams } from "@/components/shared/match-teams";
import { PredictionForm } from "@/components/matches/prediction-form";
import { PredictionsTable } from "@/components/matches/predictions-table";
import { MatchStatusIndicator } from "@/components/matches/match-status-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { getMatchDetail } from "@/lib/data/matches";
import { formatMatchDate, formatStage, scoreText } from "@/lib/display";
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
  const predictionDisabled = started || !match.participantsConfirmed;
  const predictionDisabledReason = started
    ? "As apostas estão encerradas porque o jogo já começou."
    : !match.participantsConfirmed
      ? "As apostas serão liberadas quando as duas equipes deste confronto forem confirmadas."
      : undefined;

  return (
    <AppShell>
      <Link href="/matches" className="text-sm font-medium text-emerald-700 hover:underline">
        Voltar para jogos
      </Link>
      <MessageAlert {...messages} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
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
              status={match.status as MatchStatusValue}
              startsAt={match.startsAt}
            />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {match.status === "STARTED" ? "Placar ao vivo" : "Placar"}:{" "}
              <strong className="text-slate-950">{scoreText(match.teamAScore, match.teamBScore)}</strong>
            </p>
            <p className="mt-2 text-sm text-slate-600">{match.venue}, {match.hostCity}</p>
            {!match.participantsConfirmed && (match.teamA || match.teamB) ? (
              <p className="mt-3 text-sm font-medium text-violet-700">Confronto projetado</p>
            ) : null}
            {!match.teamA || !match.teamB ? (
              <p className="mt-3 text-sm text-slate-600">
                Origem: {match.teamASlot} x {match.teamBSlot}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sua aposta</CardTitle></CardHeader>
          <CardContent>
            {match.predictionsResetAt && !prediction ? (
              <p className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                As equipes deste confronto mudaram após uma projeção anterior.
                Confira os participantes e envie uma nova aposta.
              </p>
            ) : null}
            <PredictionForm
              matchId={match.id}
              teamA={match.teamA}
              teamB={match.teamB}
              stage={match.stage as MatchStageValue}
              teamASlot={match.teamASlot}
              teamBSlot={match.teamBSlot}
              prediction={prediction}
              disabled={predictionDisabled}
              disabledReason={predictionDisabledReason}
            />
            {match.status === "STARTED" && prediction ? (
              <p className="mt-3 text-sm font-medium text-amber-700">
                Pontos provisórios: {prediction.points}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Apostas dos amigos</CardTitle></CardHeader>
        <CardContent>
          <PredictionsTable
            predictions={match.comparisonPredictions}
            provisional={match.status === "STARTED"}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
