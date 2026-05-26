export const MATCH_STAGES = [
  "GROUP_STAGE",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE_MATCH",
  "FINAL",
] as const;

export type MatchStageValue = (typeof MATCH_STAGES)[number];

export const MATCH_STATUSES = ["SCHEDULED", "STARTED", "FINISHED"] as const;

export type MatchStatusValue = (typeof MATCH_STATUSES)[number];

export const STAGE_LABELS: Record<MatchStageValue, string> = {
  GROUP_STAGE: "Fase de grupos",
  ROUND_OF_32: "Segunda fase",
  ROUND_OF_16: "Oitavas de final",
  QUARTER_FINALS: "Quartas de final",
  SEMI_FINALS: "Semifinal",
  THIRD_PLACE_MATCH: "Decisão do 3º lugar",
  FINAL: "Final",
};

export const STATUS_LABELS: Record<MatchStatusValue, string> = {
  SCHEDULED: "Agendado",
  STARTED: "Ao vivo",
  FINISHED: "Encerrado",
};
