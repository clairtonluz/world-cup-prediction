"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";
import { BrowserDateTime } from "@/components/shared/browser-date-time";
import { OfficialMatchOutcome } from "@/components/shared/official-match-outcome";
import { TeamLabel } from "@/components/shared/team-label";
import { StatusBadge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatStatus, teamText } from "@/lib/display";
import {
  type KnockoutBracketLayout,
  type KnockoutBracketMobileColumn,
  type KnockoutBracketSideColumn,
  buildKnockoutBracketLayout,
} from "@/lib/knockout-bracket-layout";
import { toggleKnockoutStageFilter } from "@/lib/knockout-bracket-filter";
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
  const [selectedMatch, setSelectedMatch] = useState<KnockoutBracketMatch | null>(null);
  const hasMatches = bracket.stages.some((stage) => stage.matches.length > 0);
  const layout = useMemo(
    () => buildKnockoutBracketLayout(bracket.stages, selectedStage),
    [bracket.stages, selectedStage],
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

      <MobileBracket
        columns={layout.mobileColumns}
        onMatchSelect={setSelectedMatch}
      />
      <DesktopBracket layout={layout} onMatchSelect={setSelectedMatch} />
      <MatchDetailDialog
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
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

function MobileBracket({
  columns,
  onMatchSelect,
}: {
  columns: KnockoutBracketMobileColumn[];
  onMatchSelect: (match: KnockoutBracketMatch) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 lg:hidden sm:-mx-8 sm:px-8">
      <div className="flex min-w-max gap-4">
        {columns.map((column) => (
          <section key={column.key} className="flex w-64 shrink-0 flex-col gap-3">
            <StageColumnHeading label={column.label} />
            <div className="space-y-3">
              {column.matches.map((match) => (
                <CompactMatchButton
                  key={match.id}
                  match={match}
                  onSelect={onMatchSelect}
                  emphasis={match.stage === "FINAL" ? "final" : "default"}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function DesktopBracket({
  layout,
  onMatchSelect,
}: {
  layout: KnockoutBracketLayout;
  onMatchSelect: (match: KnockoutBracketMatch) => void;
}) {
  const sideColumnCount = layout.leftColumns.length + layout.rightColumns.length;
  const maxColumnMatches = Math.max(
    1,
    ...layout.leftColumns.map((column) => column.matches.length),
    ...layout.rightColumns.map((column) => column.matches.length),
  );

  return (
    <div className="-mx-6 hidden overflow-x-auto px-6 pb-3 lg:block xl:-mx-8 xl:px-8">
      <div
        className="grid items-stretch gap-4"
        style={{
          gridTemplateColumns: desktopGridTemplate(layout),
          minHeight: `${Math.max(27, maxColumnMatches * 5.75)}rem`,
          minWidth: `max(100%, ${sideColumnCount * 176 + 260}px)`,
        }}
      >
        {layout.leftColumns.map((column) => (
          <DesktopSideColumn
            key={column.key}
            column={column}
            onMatchSelect={onMatchSelect}
          />
        ))}
        <DecisionColumn layout={layout} onMatchSelect={onMatchSelect} />
        {layout.rightColumns.map((column) => (
          <DesktopSideColumn
            key={column.key}
            column={column}
            onMatchSelect={onMatchSelect}
          />
        ))}
      </div>
    </div>
  );
}

function DesktopSideColumn({
  column,
  onMatchSelect,
}: {
  column: KnockoutBracketSideColumn;
  onMatchSelect: (match: KnockoutBracketMatch) => void;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <StageColumnHeading
        label={column.label}
        className={column.side === "right" ? "text-right" : undefined}
      />
      <div className="flex flex-1 flex-col justify-around gap-4 py-2">
        {column.matches.map((match) => (
          <div key={match.id} className="relative">
            <Connector side={column.side} />
            <CompactMatchButton match={match} onSelect={onMatchSelect} />
          </div>
        ))}
      </div>
    </section>
  );
}

function DecisionColumn({
  layout,
  onMatchSelect,
}: {
  layout: KnockoutBracketLayout;
  onMatchSelect: (match: KnockoutBracketMatch) => void;
}) {
  return (
    <section className="flex min-w-0 flex-col justify-center gap-5 py-8">
      {layout.finalMatch ? (
        <div className="space-y-3">
          <StageColumnHeading
            label={layout.finalLabel ?? "Final"}
            className="text-center"
          />
          <CompactMatchButton
            match={layout.finalMatch}
            onSelect={onMatchSelect}
            emphasis="final"
          />
        </div>
      ) : null}
      {layout.thirdPlaceMatch ? (
        <div className="space-y-3">
          <StageColumnHeading
            label={layout.thirdPlaceLabel ?? "Decisão do 3º lugar"}
            className="text-center"
          />
          <CompactMatchButton
            match={layout.thirdPlaceMatch}
            onSelect={onMatchSelect}
          />
        </div>
      ) : null}
    </section>
  );
}

function StageColumnHeading({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <h3 className={cn("text-sm font-semibold uppercase text-slate-500", className)}>
      {label}
    </h3>
  );
}

function Connector({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute top-1/2 hidden h-px w-4 -translate-y-1/2 bg-slate-300 lg:block",
        side === "left" ? "-right-4" : "-left-4",
      )}
    />
  );
}

function CompactMatchButton({
  match,
  onSelect,
  emphasis = "default",
}: {
  match: KnockoutBracketMatch;
  onSelect: (match: KnockoutBracketMatch) => void;
  emphasis?: "default" | "final";
}) {
  return (
    <button
      type="button"
      aria-label={`Abrir detalhes do jogo ${match.matchNumber}: ${teamText(
        match.teamA.team,
        match.teamA.slot,
      )} x ${teamText(match.teamB.team, match.teamB.slot)}`}
      onClick={() => onSelect(match)}
      className={cn(
        "group w-full rounded-lg border bg-white p-2 text-left shadow-sm shadow-slate-950/[0.04] transition-colors hover:border-[#0e74e1]/40 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1] focus-visible:ring-offset-2",
        emphasis === "final"
          ? "border-[#0e74e1]/35 bg-blue-50/70"
          : "border-slate-200",
      )}
    >
      <div className="space-y-1.5">
        <CompactTeamLine
          side={match.teamA}
          score={match.teamAScore}
          advancingTeam={match.advancingTeam}
        />
        <CompactTeamLine
          side={match.teamB}
          score={match.teamBScore}
          advancingTeam={match.advancingTeam}
        />
      </div>
    </button>
  );
}

function CompactTeamLine({
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
        "grid min-h-8 grid-cols-[minmax(0,1fr)_1.75rem] items-center gap-2 rounded-md px-2 py-1.5 text-xs",
        isAdvancing
          ? "bg-emerald-100 text-emerald-950"
          : "bg-slate-50 text-slate-950",
      )}
    >
      <TeamLabel
        team={side.team}
        slot={side.team ? null : side.slot}
        className="min-w-0"
        textClassName="min-w-0 break-words leading-tight"
      />
      <span className="text-right font-semibold tabular-nums">
        {score ?? "-"}
      </span>
    </div>
  );
}

function MatchDetailDialog({
  match,
  onClose,
}: {
  match: KnockoutBracketMatch | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (match && !dialog.open) {
      dialog.showModal();
    } else if (!match && dialog.open) {
      dialog.close();
    }
  }, [match]);

  const participantExplanation = match
    ? buildKnockoutMatchExplanation(match.teamA, match.teamB)
    : "";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (match) {
          onClose();
        }
      }}
      className="m-auto w-[min(36rem,calc(100%-2rem))] rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/55"
    >
      {match ? (
        <>
          <header className="flex items-start justify-between gap-4 p-5 pb-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Jogo #{match.matchNumber}
              </p>
              <h2
                id={titleId}
                className="mt-1 text-xl font-semibold leading-tight text-slate-950"
              >
                {teamText(match.teamA.team, match.teamA.slot)} x{" "}
                {teamText(match.teamB.team, match.teamB.slot)}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                <BrowserDateTime value={match.startsAt} format="matchDate" />
              </p>
            </div>
            <button
              type="button"
              aria-label="Fechar detalhes do jogo"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#0e74e1]/40 hover:bg-blue-50/60 hover:text-[#0756ac] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1] focus-visible:ring-offset-2"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="space-y-4 px-5 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={match.status}>
                {formatStatus(match.status)}
              </StatusBadge>
              {match.projected ? (
                <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                  Projeção
                </span>
              ) : null}
              {match.sourceMatchNumbers.length > 0 ? (
                <span className="text-[11px] font-medium text-slate-500">
                  Origem:{" "}
                  {match.sourceMatchNumbers
                    .map((number) => `Jogo ${number}`)
                    .join(", ")}
                </span>
              ) : null}
            </div>

            <div className="rounded-md bg-blue-50/70 p-3 text-xs leading-5 text-slate-700">
              <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                Definição das seleções
              </p>
              <p className="mt-1">{participantExplanation}</p>
            </div>

            <div className="space-y-2">
              <BracketTeamLine
                side={match.teamA}
                score={match.teamAScore}
                advancingTeam={match.advancingTeam}
                linkToTeamMatches
              />
              <BracketTeamLine
                side={match.teamB}
                score={match.teamBScore}
                advancingTeam={match.advancingTeam}
                linkToTeamMatches
              />
            </div>

            <OfficialMatchOutcome
              stage={match.stage}
              advancingTeam={match.advancingTeam}
              linkToTeamMatches
              className="rounded-md bg-emerald-50 px-2.5 py-2"
            />

            <p className="text-xs leading-snug text-slate-500">
              {match.hostCity} - {match.venue}
            </p>

            <PredictionSummary
              prediction={match.prediction}
              showPoints={match.status !== "SCHEDULED"}
            />
          </div>

          <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Fechar
            </button>
            <Link
              href={`/matches/${match.id}`}
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Ver jogo
            </Link>
          </footer>
        </>
      ) : null}
    </dialog>
  );
}

function BracketTeamLine({
  side,
  score,
  advancingTeam,
  linkToTeamMatches = false,
}: {
  side: KnockoutBracketSide;
  score: number | null;
  advancingTeam: string | null;
  linkToTeamMatches?: boolean;
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
          linkToTeamMatches={linkToTeamMatches && side.team !== null}
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
      <div className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Meu palpite</p>
        <p className="mt-1">Sem palpite enviado.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-slate-50 p-2 text-xs text-slate-700">
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

function desktopGridTemplate(layout: KnockoutBracketLayout) {
  const leftTemplate = layout.leftColumns
    .map(() => "minmax(10.5rem, 1fr)")
    .join(" ");
  const rightTemplate = layout.rightColumns
    .map(() => "minmax(10.5rem, 1fr)")
    .join(" ");

  return [leftTemplate, "minmax(13.5rem, 0.9fr)", rightTemplate]
    .filter(Boolean)
    .join(" ");
}
