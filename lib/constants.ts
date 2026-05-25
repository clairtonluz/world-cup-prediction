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
  GROUP_STAGE: "Group Stage",
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINALS: "Quarter Finals",
  SEMI_FINALS: "Semi Finals",
  THIRD_PLACE_MATCH: "Third Place Match",
  FINAL: "Final",
};

export const STATUS_LABELS: Record<MatchStatusValue, string> = {
  SCHEDULED: "Scheduled",
  STARTED: "Started",
  FINISHED: "Finished",
};
