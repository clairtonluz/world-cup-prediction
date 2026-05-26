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
  const [mounted, setMounted] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<MatchStatusValue>(status);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status !== "SCHEDULED") {
      setCurrentStatus(status);
      setTimeLeft("");
      return;
    }

    const targetDate = new Date(startsAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setCurrentStatus("STARTED");
        setTimeLeft("");
        return true; // Finished
      }

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours % 24}h`);
      } else {
        const h = hours.toString().padStart(2, "0");
        const m = (minutes % 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        setTimeLeft(`${h}:${m}:${s}`);
      }
      return false;
    };

    const isFinished = updateTimer();
    if (isFinished) return;

    const interval = setInterval(() => {
      if (updateTimer()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startsAt]);

  return (
    <div className="flex flex-col items-end gap-1">
      <StatusBadge status={currentStatus}>
        {formatStatus(currentStatus)}
      </StatusBadge>
      {mounted && timeLeft && (
        <span className="font-mono text-[10px] font-medium text-slate-500 tabular-nums uppercase">
          Começa em {timeLeft}
        </span>
      )}
    </div>
  );
}
