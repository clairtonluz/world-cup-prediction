import {
  STAGE_LABELS,
  STATUS_LABELS,
  type MatchStageValue,
  type MatchStatusValue,
} from "@/lib/constants";

type DateDisplayOptions = {
  timeZone?: string;
};

export function formatStage(stage: MatchStageValue) {
  return STAGE_LABELS[stage];
}

export function formatStatus(status: MatchStatusValue) {
  return STATUS_LABELS[status];
}

export function formatMatchDate(date: Date, options: DateDisplayOptions = {}) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...timeZoneOption(options.timeZone),
  }).format(date);
}

export function formatDateTime(date: Date, options: DateDisplayOptions = {}) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    ...timeZoneOption(options.timeZone),
  }).format(date);
}

export function formatMatchDay(date: Date, options: DateDisplayOptions = {}) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    ...timeZoneOption(options.timeZone),
  }).format(date);
}

export function formatMatchTime(date: Date, options: DateDisplayOptions = {}) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    ...timeZoneOption(options.timeZone),
  }).format(date);
}

export function matchDayKey(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    ...timeZoneOption(timeZone),
  }).format(date);
}

export function teamText(team: string | null, slot: string | null) {
  return team ?? slot ?? "A definir";
}

function timeZoneOption(timeZone: string | undefined) {
  return timeZone ? { timeZone } : {};
}
