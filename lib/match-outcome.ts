import type { MatchStageValue } from "@/lib/constants";

const KNOCKOUT_OUTCOME_LABELS: Partial<Record<MatchStageValue, string>> = {
  ROUND_OF_32: "Classificada",
  ROUND_OF_16: "Classificada",
  QUARTER_FINALS: "Classificada",
  SEMI_FINALS: "Classificada",
  FINAL: "Campeão",
  THIRD_PLACE_MATCH: "Vencedor",
};

export function officialMatchOutcomeLabel(
  stage: MatchStageValue,
  advancingTeam: string | null,
) {
  if (!advancingTeam) {
    return null;
  }

  return KNOCKOUT_OUTCOME_LABELS[stage] ?? null;
}
