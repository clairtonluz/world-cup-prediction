import type { ReactNode } from "react";
import Link from "next/link";
import { MatchStatusIndicator } from "@/components/matches/match-status-indicator";
import { PredictionForm } from "@/components/matches/prediction-form";
import { OfficialMatchOutcome } from "@/components/shared/official-match-outcome";
import { TeamLabel } from "@/components/shared/team-label";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { formatMatchDate, formatStage, teamText } from "@/lib/display";
import { mayEditPrediction } from "@/lib/match-rules";
import { cn } from "@/lib/utils";

export type MatchCardMatch = {
  id: string;
  matchNumber?: number;
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
  advancingTeam: string | null;
  venue?: string;
  hostCity?: string;
  predictions?: {
    teamAScore: number;
    teamBScore: number;
    predictedAdvancingTeam: string | null;
    points: number;
  }[];
};

type MatchCardPrediction = NonNullable<MatchCardMatch["predictions"]>[number];

type MatchCardProps = {
  match: MatchCardMatch;
  highlighted?: boolean;
  showDetails?: boolean;
  fieldIdPrefix?: string;
};

export function MatchCard({
  match,
  highlighted = false,
  showDetails = false,
  fieldIdPrefix = "match-card",
}: MatchCardProps) {
  const prediction = match.predictions?.[0];
  const status = match.status as MatchStatusValue;
  const stage = match.stage as MatchStageValue;
  const formattedStage = formatStage(stage);
  const formattedDate = formatMatchDate(match.startsAt);
  const editable = mayEditPrediction({
    startsAt: match.startsAt,
    status,
    participantsConfirmed: match.participantsConfirmed,
  });

  return (
    <Card
      className={cn(
        highlighted && "border-emerald-300 bg-white shadow-emerald-950/[0.08]",
      )}
    >
      <CardHeader>
        <CardTitle className="sr-only">
          {teamText(match.teamA, match.teamASlot)} x{" "}
          {teamText(match.teamB, match.teamBSlot)} - {formattedStage}
        </CardTitle>
        <MatchCardScorePanel
          match={match}
          predictionContent={
            editable ? (
              <PredictionForm
                matchId={match.id}
                teamA={match.teamA}
                teamB={match.teamB}
                stage={stage}
                teamASlot={match.teamASlot}
                teamBSlot={match.teamBSlot}
                prediction={prediction}
                disabled={false}
                returnTo="matches"
                fieldIdPrefix={`${fieldIdPrefix}-${match.id}`}
                variant="inline"
                inlineLayout="scoreOnly"
              />
            ) : (
              <PredictionScoreSummary
                prediction={prediction}
                showPoints={match.status !== "SCHEDULED"}
              />
            )
          }
        />
      </CardHeader>
      <CardContent className="flex flex-wrap items-end justify-between gap-3 pt-0">
        <div className="space-y-1">
          <p className="text-sm text-slate-600">
            {formattedStage} - {formattedDate}
          </p>
          <OfficialMatchOutcome
            stage={stage}
            advancingTeam={match.advancingTeam}
            linkToTeamMatches
            className="mt-2"
          />
          {showDetails &&
          match.matchNumber !== undefined &&
          match.venue &&
          match.hostCity ? (
            <p className="text-xs text-slate-500">
              Jogo #{match.matchNumber} - {match.venue}, {match.hostCity}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end justify-end gap-3">
          <MatchStatusIndicator
            status={status}
            startsAt={match.startsAt}
          />
          <Link
            href={`/matches/${match.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver jogo
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchCardScorePanel({
  match,
  predictionContent,
}: {
  match: MatchCardMatch;
  predictionContent: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 text-base font-semibold sm:text-lg">
      <TeamLabel
        team={match.teamA}
        slot={match.teamASlot}
        linkToTeamMatches
        className="min-w-0 flex-row-reverse justify-start text-right"
        textClassName="min-w-0 break-words leading-tight"
      />
      <div className="flex w-[9.5rem] flex-col items-center gap-1">
        <RealScoreLine
          teamAScore={match.teamAScore}
          teamBScore={match.teamBScore}
        />
        {predictionContent}
      </div>
      <TeamLabel
        team={match.teamB}
        slot={match.teamBSlot}
        linkToTeamMatches
        className="min-w-0"
        textClassName="min-w-0 break-words leading-tight"
      />
    </div>
  );
}

function RealScoreLine({
  teamAScore,
  teamBScore,
}: {
  teamAScore: number | null;
  teamBScore: number | null;
}) {
  const hasScore = teamAScore !== null && teamBScore !== null;

  return (
    <span className="grid w-full grid-cols-[4rem_auto_4rem] items-center gap-1 text-center font-semibold tabular-nums">
      <span>{hasScore ? teamAScore : null}</span>
      <span className="text-slate-400">x</span>
      <span>{hasScore ? teamBScore : null}</span>
    </span>
  );
}

function PredictionScoreSummary({
  prediction,
  showPoints,
}: {
  prediction: MatchCardPrediction | undefined;
  showPoints: boolean;
}) {
  if (!prediction) {
    return (
      <p className="text-center text-xs font-medium text-slate-500">
        Sem palpite
      </p>
    );
  }

  return (
    <div className="w-full text-xs font-medium text-slate-600">
      <p className="grid w-full grid-cols-[4rem_auto_4rem] items-center gap-1 text-center tabular-nums">
        <span>{prediction.teamAScore}</span>
        <span className="text-slate-400">x</span>
        <span>{prediction.teamBScore}</span>
      </p>
      {showPoints ? (
        <p className="mt-0.5 text-center text-[11px] text-slate-500">
          {prediction.points} pts
        </p>
      ) : null}
    </div>
  );
}
