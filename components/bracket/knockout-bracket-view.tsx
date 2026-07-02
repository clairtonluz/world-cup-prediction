"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { BrowserDateTime } from "@/components/shared/browser-date-time";
import { OfficialMatchOutcome } from "@/components/shared/official-match-outcome";
import { TeamLabel } from "@/components/shared/team-label";
import { StatusBadge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { formatStatus } from "@/lib/display";
import {
  filterKnockoutStagesFrom,
  toggleKnockoutStageFilter,
} from "@/lib/knockout-bracket-filter";
import { buildKnockoutMatchExplanation } from "@/lib/knockout-bracket-explanation";
import type {
  KnockoutBracket,
  KnockoutBracketMatch,
  KnockoutBracketStage,
  KnockoutBracketSide,
  KnockoutPrediction,
  KnockoutStageValue,
} from "@/lib/knockout-bracket";
import { cn } from "@/lib/utils";

export function KnockoutBracketView({ bracket }: { bracket: KnockoutBracket }) {
  const [selectedStage, setSelectedStage] = useState<KnockoutStageValue | null>(null);
  const hasMatches = bracket.stages.some((stage) => stage.matches.length > 0);
  const visibleStages = useMemo(
    () => filterKnockoutStagesFrom(bracket.stages, selectedStage),
    [bracket.stages, selectedStage],
  );
  const visibleStageCount = visibleStages.length;
  const maxVisibleStageMatches = Math.max(
    1,
    ...visibleStages.map((stage) => stage.matches.length),
  );

  if (!hasMatches) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
        Nenhum jogo de mata-mata disponível.
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="knockout-bracket-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="knockout-bracket-title" className="text-xl font-semibold text-slate-950">
            Chaveamento
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Caminho oficial da segunda fase até a decisão, no horário do seu navegador.
          </p>
        </div>
        {bracket.hasProjectedParticipants ? (
          <span className="inline-flex w-fit items-center justify-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Projeções pela classificação atual
          </span>
        ) : null}
      </div>

      <StageFilterBar
        stages={bracket.stages}
        selectedStage={selectedStage}
        onSelect={setSelectedStage}
      />

      <div className="space-y-6 lg:hidden">
        {visibleStages.map((stage) => (
          <section key={stage.stage} className="space-y-3">
            <StageHeading stage={stage} />
            <div className="space-y-3">
              {stage.matches.map((match) => (
                <BracketMatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="-mx-6 hidden overflow-x-auto px-6 pb-2 lg:block">
        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: `repeat(${visibleStageCount}, minmax(13.5rem, 1fr))`,
            minHeight: `${Math.max(24, maxVisibleStageMatches * 12)}rem`,
            minWidth: `max(100%, ${visibleStageCount * 230}px)`,
          }}
        >
          {visibleStages.map((stage) => (
            <section key={stage.stage} className="flex min-w-0 flex-col">
              <StageHeading stage={stage} className="mb-3" />
              <div className="flex flex-1 flex-col justify-around gap-4">
                {stage.matches.map((match) => (
                  <BracketMatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function StageFilterBar({
  stages,
  selectedStage,
  onSelect,
}: {
  stages: KnockoutBracketStage[];
  selectedStage: KnockoutStageValue | null;
  onSelect: (stage: KnockoutStageValue | null) => void;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 border-y border-slate-200 bg-slate-50/95 px-4 py-3 shadow-sm shadow-slate-950/[0.04] backdrop-blur supports-[backdrop-filter]:bg-slate-50/85 sm:-mx-8 sm:px-8">
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Filtros de fases do mata-mata"
      >
        {stages.map((stage) => (
          <StageFilterButton
            key={stage.stage}
            stage={stage}
            selectedStage={selectedStage}
            onSelect={onSelect}
            className="w-auto shrink-0 whitespace-nowrap px-3 text-center text-xs sm:text-sm"
          />
        ))}
      </div>
    </div>
  );
}

function StageHeading({
  stage,
  className,
}: {
  stage: KnockoutBracketStage;
  className?: string;
}) {
  return (
    <h3 className={cn("text-sm font-semibold uppercase text-slate-500", className)}>
      {stage.label}
    </h3>
  );
}

function StageFilterButton({
  stage,
  selectedStage,
  onSelect,
  className,
}: {
  stage: KnockoutBracketStage;
  selectedStage: KnockoutStageValue | null;
  onSelect: (stage: KnockoutStageValue | null) => void;
  className?: string;
}) {
  const selected = selectedStage === stage.stage;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={
        selected
          ? `Remover filtro de ${stage.label}`
          : `Filtrar a partir de ${stage.label}`
      }
      onClick={() => onSelect(toggleKnockoutStageFilter(selectedStage, stage.stage))}
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1] focus-visible:ring-offset-2",
        selected
          ? "border-[#080b12] bg-[#080b12] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-[#0e74e1]/40 hover:bg-blue-50/60 hover:text-[#0756ac]",
        className,
      )}
    >
      {stage.label}
    </button>
  );
}

function BracketMatchCard({ match }: { match: KnockoutBracketMatch }) {
  const participantExplanation = buildKnockoutMatchExplanation(
    match.teamA,
    match.teamB,
  );

  return (
    <article className="relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/[0.04]">
      {match.sourceMatchNumbers.length > 0 ? (
        <span aria-hidden className="hidden lg:block">
          <span className="absolute -left-5 top-1/2 h-px w-5 bg-slate-300" />
          <span className="absolute -left-5 top-1/2 h-12 w-px -translate-y-1/2 bg-slate-300" />
        </span>
      ) : null}

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Jogo #{match.matchNumber}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            <BrowserDateTime value={match.startsAt} format="matchDate" />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Tooltip
            ariaLabel={`Explicar definição das seleções do jogo ${match.matchNumber}`}
            label={<Info className="h-4 w-4" aria-hidden />}
            description={participantExplanation}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 no-underline hover:border-[#0e74e1]/40 hover:bg-blue-50/60 hover:text-[#0756ac] focus-visible:ring-offset-2"
          />
          <StatusBadge status={match.status}>
            {formatStatus(match.status)}
          </StatusBadge>
        </div>
      </header>

      <div className="mt-3 space-y-2">
        <BracketTeamLine
          side={match.teamA}
          score={match.teamAScore}
          advancingTeam={match.advancingTeam}
        />
        <BracketTeamLine
          side={match.teamB}
          score={match.teamBScore}
          advancingTeam={match.advancingTeam}
        />
      </div>
      <OfficialMatchOutcome
        stage={match.stage}
        advancingTeam={match.advancingTeam}
        linkToTeamMatches
        className="mt-3 rounded-md bg-emerald-50 px-2.5 py-2"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {match.projected ? (
          <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
            Projeção
          </span>
        ) : null}
        {match.sourceMatchNumbers.length > 0 ? (
          <span className="text-[11px] font-medium text-slate-500">
            Origem: {match.sourceMatchNumbers.map((number) => `Jogo ${number}`).join(", ")}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-snug text-slate-500">
        {match.hostCity} - {match.venue}
      </p>

      <PredictionSummary
        prediction={match.prediction}
        showPoints={match.status !== "SCHEDULED"}
      />

      <Link
        href={`/matches/${match.id}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full")}
      >
        Ver jogo
      </Link>
    </article>
  );
}

function BracketTeamLine({
  side,
  score,
  advancingTeam,
}: {
  side: KnockoutBracketSide;
  score: number | null;
  advancingTeam: string | null;
}) {
  const isAdvancing = side.team !== null && side.team === advancingTeam;

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-2 rounded-md border px-2.5 py-2 text-sm",
        isAdvancing
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-slate-100 bg-slate-50 text-slate-950",
      )}
    >
      <div className="min-w-0">
        <TeamLabel
          team={side.team}
          slot={side.team ? null : side.slot}
          linkToTeamMatches={side.team !== null}
          className="min-w-0"
          textClassName="min-w-0 break-words leading-tight"
        />
        {side.team && side.slot ? (
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            Slot {side.slot}
          </p>
        ) : null}
      </div>
      <span className="text-right font-semibold tabular-nums">
        {score ?? "-"}
      </span>
    </div>
  );
}

function PredictionSummary({
  prediction,
  showPoints,
}: {
  prediction: KnockoutPrediction | null;
  showPoints: boolean;
}) {
  if (!prediction) {
    return (
      <div className="mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Meu palpite</p>
        <p className="mt-1">Sem palpite enviado.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-700">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-800">Meu palpite</p>
          <p className="mt-1 font-medium tabular-nums">
            {prediction.teamAScore} x {prediction.teamBScore}
          </p>
        </div>
        {showPoints ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
            {prediction.points} pts
          </span>
        ) : null}
      </div>
      {prediction.predictedAdvancingTeam ? (
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1">
          <span className="text-slate-500">Avança:</span>
          <TeamLabel
            team={prediction.predictedAdvancingTeam}
            className="min-w-0"
            textClassName="min-w-0 break-words"
          />
        </div>
      ) : null}
    </div>
  );
}
