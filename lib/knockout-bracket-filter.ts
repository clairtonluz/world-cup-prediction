import type {
  KnockoutBracketStage,
  KnockoutStageValue,
} from "@/lib/knockout-bracket";

export function filterKnockoutStagesFrom(
  stages: KnockoutBracketStage[],
  selectedStage: KnockoutStageValue | null,
) {
  if (!selectedStage) {
    return stages;
  }

  const selectedIndex = stages.findIndex((stage) => stage.stage === selectedStage);

  return selectedIndex >= 0 ? stages.slice(selectedIndex) : stages;
}

export function toggleKnockoutStageFilter(
  currentStage: KnockoutStageValue | null,
  clickedStage: KnockoutStageValue,
) {
  return currentStage === clickedStage ? null : clickedStage;
}
