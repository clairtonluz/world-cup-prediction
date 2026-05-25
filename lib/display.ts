import {
  STAGE_LABELS,
  STATUS_LABELS,
  type MatchStageValue,
  type MatchStatusValue,
} from "@/lib/constants";

export function formatStage(stage: MatchStageValue) {
  return STAGE_LABELS[stage];
}

export function formatStatus(status: MatchStatusValue) {
  return STATUS_LABELS[status];
}

export function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function scoreText(
  teamAScore: number | null,
  teamBScore: number | null,
) {
  return teamAScore === null || teamBScore === null
    ? "-"
    : `${teamAScore} x ${teamBScore}`;
}
