import {
  STAGE_LABELS,
  STATUS_LABELS,
  type MatchStageValue,
  type MatchStatusValue,
} from "@/lib/constants";

export const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

export function formatStage(stage: MatchStageValue) {
  return STAGE_LABELS[stage];
}

export function formatStatus(status: MatchStatusValue) {
  return STATUS_LABELS[status];
}

export function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date);
}

export function formatMatchDay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date);
}

export function formatMatchTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date);
}

export function matchDayKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeZone: BRAZIL_TIME_ZONE,
  }).format(date);
}

export function teamText(team: string | null, slot: string | null) {
  return team ?? slot ?? "A definir";
}

export function scoreText(
  teamAScore: number | null,
  teamBScore: number | null,
) {
  return teamAScore === null || teamBScore === null
    ? "-"
    : `${teamAScore} x ${teamBScore}`;
}
