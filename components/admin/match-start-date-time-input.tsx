"use client";

import { useMemo, useState } from "react";
import { useBrowserTimeZone } from "@/components/shared/browser-date-time";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MatchStartDateTimeInputProps = {
  value: Date | string;
};

export function MatchStartDateTimeInput({
  value,
}: MatchStartDateTimeInputProps) {
  const startsAt = useMemo(() => toDate(value), [value]);
  const timeZone = useBrowserTimeZone();
  const [editedValue, setEditedValue] = useState<string | null>(null);
  const localValue = editedValue ?? toDateTimeLocalValue(startsAt, timeZone);
  const isoValue =
    editedValue === null ? startsAt.toISOString() : toIsoDateTime(editedValue);

  return (
    <div className="max-w-sm">
      <Label htmlFor="startsAtLocal">Horário de início</Label>
      <Input
        id="startsAtLocal"
        type="datetime-local"
        required
        value={localValue}
        onChange={(event) => {
          setEditedValue(event.currentTarget.value);
        }}
      />
      <input type="hidden" name="startsAt" value={isoValue} />
      <p className="mt-1 text-xs text-slate-500">
        Horário no fuso do seu navegador: {timeZone}
      </p>
    </div>
  );
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toDateTimeLocalValue(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const year = partValue(parts, "year");
  const month = partValue(parts, "month");
  const day = partValue(parts, "day");
  const hours = partValue(parts, "hour");
  const minutes = partValue(parts, "minute");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoDateTime(localValue: string) {
  const parsed = new Date(localValue);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function partValue(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}
