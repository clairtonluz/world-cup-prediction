"use client";

import { useSyncExternalStore } from "react";
import {
  formatDateTime,
  formatMatchDate,
  formatMatchDay,
  formatMatchTime,
} from "@/lib/display";

type BrowserDateTimeFormat = "matchDate" | "dateTime" | "matchDay" | "matchTime";

type BrowserDateTimeProps = {
  value: Date | string;
  format?: BrowserDateTimeFormat;
  className?: string;
};

const FALLBACK_TIME_ZONE = "UTC";

export function useBrowserTimeZone() {
  return useSyncExternalStore(
    subscribeToTimeZone,
    browserTimeZoneSnapshot,
    serverTimeZoneSnapshot,
  );
}

export function BrowserDateTime({
  value,
  format = "matchDate",
  className,
}: BrowserDateTimeProps) {
  const timeZone = useBrowserTimeZone();
  const date = toDate(value);

  return (
    <time dateTime={date.toISOString()} className={className}>
      {formatDateForBrowser(date, format, timeZone)}
    </time>
  );
}

function formatDateForBrowser(
  date: Date,
  format: BrowserDateTimeFormat,
  timeZone: string,
) {
  switch (format) {
    case "dateTime":
      return formatDateTime(date, { timeZone });
    case "matchDay":
      return formatMatchDay(date, { timeZone });
    case "matchTime":
      return formatMatchTime(date, { timeZone });
    case "matchDate":
      return formatMatchDate(date, { timeZone });
  }
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function subscribeToTimeZone() {
  return () => {};
}

function browserTimeZoneSnapshot() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? FALLBACK_TIME_ZONE;
}

function serverTimeZoneSnapshot() {
  return FALLBACK_TIME_ZONE;
}
