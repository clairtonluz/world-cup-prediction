"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { formatStatus } from "@/lib/display";
import type { MatchStatusValue } from "@/lib/constants";

type MatchStatusIndicatorProps = {
  status: MatchStatusValue;
  startsAt: Date | string;
};

export function MatchStatusIndicator({
  status,
  startsAt,
}: MatchStatusIndicatorProps) {
  const [now, setNow] = useState<number | null>(null);
  const targetTime = new Date(startsAt).getTime();

  useEffect(() => {
    if (status !== "SCHEDULED") {
      return;
    }

    const updateTimer = () => setNow(Date.now());

    const firstUpdate = window.setTimeout(updateTimer, 0);
    const interval = window.setInterval(updateTimer, 1000);

    return () => {
      window.clearTimeout(firstUpdate);
      window.clearInterval(interval);
    };
  }, [status, startsAt]);

  const currentStatus =
    status === "SCHEDULED" && now !== null && now >= targetTime
      ? "STARTED"
      : status;
  const timeLeft = formatTimeLeft(now, targetTime, status);

  return (
    <div className="flex flex-col items-end gap-1">
      <StatusBadge status={currentStatus}>
        {formatStatus(currentStatus)}
      </StatusBadge>
      {timeLeft ? (
        <span className="font-mono text-[10px] font-medium text-slate-500 tabular-nums uppercase">
          Começa em {timeLeft}
        </span>
      ) : null}
    </div>
  );
}

function formatTimeLeft(
  now: number | null,
  targetTime: number,
  status: MatchStatusValue,
) {
  if (status !== "SCHEDULED" || now === null) {
    return "";
  }

  const diff = targetTime - now;
  if (diff <= 0) {
    return "";
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }

  const h = hours.toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}
