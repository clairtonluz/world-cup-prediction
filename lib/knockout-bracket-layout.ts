import { filterKnockoutStagesFrom } from "@/lib/knockout-bracket-filter";
import type {
  KnockoutBracketMatch,
  KnockoutBracketStage,
  KnockoutStageValue,
} from "@/lib/knockout-bracket";

type BracketSide = "left" | "right";

export type KnockoutBracketSideColumn = {
  key: string;
  stage: KnockoutStageValue;
  label: string;
  matches: KnockoutBracketMatch[];
  side: BracketSide;
};

export type KnockoutBracketMobileColumn = {
  key: string;
  label: string;
  matches: KnockoutBracketMatch[];
};

export type KnockoutBracketLayout = {
  visibleStages: KnockoutBracketStage[];
  leftColumns: KnockoutBracketSideColumn[];
  rightColumns: KnockoutBracketSideColumn[];
  mobileColumns: KnockoutBracketMobileColumn[];
  finalMatch: KnockoutBracketMatch | null;
  finalLabel: string | null;
  thirdPlaceMatch: KnockoutBracketMatch | null;
  thirdPlaceLabel: string | null;
};

export function buildKnockoutBracketLayout(
  stages: KnockoutBracketStage[],
  selectedStage: KnockoutStageValue | null,
): KnockoutBracketLayout {
  const visibleStages = filterKnockoutStagesFrom(stages, selectedStage);
  const finalStage = findStage(visibleStages, "FINAL");
  const thirdPlaceStage = findStage(visibleStages, "THIRD_PLACE_MATCH");
  const progressionStages = visibleStages.filter(isProgressionStage);
  const finalMatch = finalStage?.matches[0] ?? null;
  const thirdPlaceMatch = thirdPlaceStage?.matches[0] ?? null;

  return {
    visibleStages,
    leftColumns: progressionStages
      .map((stage) => toSideColumn(stage, "left"))
      .filter(hasMatches),
    rightColumns: progressionStages
      .map((stage) => toSideColumn(stage, "right"))
      .filter(hasMatches)
      .reverse(),
    mobileColumns: [
      ...progressionStages
        .filter((stage) => stage.matches.length > 0)
        .map((stage) => ({
          key: stage.stage,
          label: stage.label,
          matches: stage.matches,
        })),
      ...decisionColumn(finalMatch, thirdPlaceMatch),
    ],
    finalMatch,
    finalLabel: finalStage?.label ?? null,
    thirdPlaceMatch,
    thirdPlaceLabel: thirdPlaceStage?.label ?? null,
  };
}

function toSideColumn(
  stage: KnockoutBracketStage,
  side: BracketSide,
): KnockoutBracketSideColumn {
  const midpoint = Math.ceil(stage.matches.length / 2);
  const matches =
    side === "left"
      ? stage.matches.slice(0, midpoint)
      : stage.matches.slice(midpoint);

  return {
    key: `${side}-${stage.stage}`,
    stage: stage.stage,
    label: stage.label,
    matches,
    side,
  };
}

function decisionColumn(
  finalMatch: KnockoutBracketMatch | null,
  thirdPlaceMatch: KnockoutBracketMatch | null,
) {
  const matches = [finalMatch, thirdPlaceMatch].filter(
    (match): match is KnockoutBracketMatch => match !== null,
  );

  return matches.length > 0
    ? [
        {
          key: "decisions",
          label: "Decisão",
          matches,
        },
      ]
    : [];
}

function findStage(
  stages: KnockoutBracketStage[],
  stageValue: KnockoutStageValue,
) {
  return stages.find((stage) => stage.stage === stageValue);
}

function isProgressionStage(stage: KnockoutBracketStage) {
  return stage.stage !== "FINAL" && stage.stage !== "THIRD_PLACE_MATCH";
}

function hasMatches(column: KnockoutBracketSideColumn) {
  return column.matches.length > 0;
}
