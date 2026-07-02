import Link from "next/link";
import { PredictionForm } from "@/components/matches/prediction-form";
import { MatchStatusIndicator } from "@/components/matches/match-status-indicator";
import { BrowserDateTime } from "@/components/shared/browser-date-time";
import { MatchScoreboard } from "@/components/shared/match-scoreboard";
import { OfficialMatchOutcome } from "@/components/shared/official-match-outcome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  MATCH_STAGES,
  type MatchStageValue,
  type MatchStatusValue,
} from "@/lib/constants";
import type { PersonalPrediction } from "@/lib/data/predictions";
import { formatStage } from "@/lib/display";
import { mayEditPrediction } from "@/lib/match-rules";

export function PersonalPredictionsList({
  predictions,
}: {
  predictions: PersonalPrediction[];
}) {
  if (predictions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-slate-600">
          Você ainda não enviou nenhuma aposta.{" "}
          <Link href="/matches" className="font-medium text-emerald-700 hover:underline">
            Ver jogos disponíveis
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-7">
      {MATCH_STAGES.map((stage) => {
        const stagePredictions = predictions.filter(
          (prediction) => prediction.match.stage === stage,
        );

        if (stagePredictions.length === 0) {
          return null;
        }

        return (
          <section key={stage} className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-950">
              {formatStage(stage)}
            </h2>
            {stagePredictions.map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: PersonalPrediction }) {
  const match = prediction.match;
  const status = match.status as MatchStatusValue;
  const stage = match.stage as MatchStageValue;
  const editable = mayEditPrediction({
    startsAt: match.startsAt,
    status,
    participantsConfirmed: match.participantsConfirmed,
  });
  const hasScoredResult =
    status !== "SCHEDULED" &&
    match.teamAScore !== null &&
    match.teamBScore !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>
            <MatchScoreboard
              teamA={match.teamA}
              teamB={match.teamB}
              teamASlot={match.teamASlot}
              teamBSlot={match.teamBSlot}
              linkToTeamMatches
              teamAScore={match.teamAScore}
              teamBScore={match.teamBScore}
              size="compact"
              className="text-base font-semibold sm:text-lg"
            />
          </CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Jogo #{match.matchNumber} -{" "}
            <BrowserDateTime value={match.startsAt} format="matchDate" />
          </p>
        </div>
        <MatchStatusIndicator status={status} startsAt={match.startsAt} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Sua aposta</p>
            <p className="font-semibold text-slate-950">
              {prediction.teamAScore} x {prediction.teamBScore}
            </p>
            {prediction.predictedAdvancingTeam ? (
              <p className="text-xs text-slate-600">
                Classificada: {prediction.predictedAdvancingTeam}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-slate-500">
              {status === "STARTED" && hasScoredResult
                ? "Pontos provisórios"
                : "Pontos"}
            </p>
            <p className="font-semibold text-slate-950">
              {hasScoredResult ? `${prediction.points} pts` : "-"}
            </p>
            <OfficialMatchOutcome
              stage={stage}
              advancingTeam={match.advancingTeam}
              linkToTeamMatches
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/matches/${match.id}`}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Ver jogo
          </Link>
          {editable ? (
            <details>
              <summary className={buttonVariants({ variant: "outline", size: "sm" })}>
                Editar aposta
              </summary>
              <div className="mt-4 min-w-[min(28rem,calc(100vw-4rem))] rounded-xl border border-slate-200 bg-white p-4">
                <PredictionForm
                  matchId={match.id}
                  teamA={match.teamA}
                  teamB={match.teamB}
                  teamASlot={match.teamASlot}
                  teamBSlot={match.teamBSlot}
                  stage={stage}
                  prediction={prediction}
                  disabled={false}
                  returnTo="apostas"
                  fieldIdPrefix={`prediction-${prediction.id}`}
                />
              </div>
            </details>
          ) : (
            <p className="text-sm text-slate-500">
              {!match.participantsConfirmed && status === "SCHEDULED"
                ? "Edição disponível quando o confronto for confirmado."
                : "Edição encerrada."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
