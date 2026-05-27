"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TooltipPosition = {
  left: number;
  top: number;
};

export function Tooltip({
  label,
  description,
  className,
}: {
  label: string;
  description: string;
  className?: string;
}) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const isOpen = position !== null;

  function clearHideTimer() {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function showTooltip() {
    clearHideTimer();

    if (triggerRef.current) {
      setPosition(calculateTooltipPosition(triggerRef.current.getBoundingClientRect()));
    }
  }

  function hideTooltip() {
    clearHideTimer();
    setPosition(null);
  }

  function scheduleTooltipHide() {
    if (document.activeElement === triggerRef.current) {
      return;
    }

    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => setPosition(null), 100);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updatePosition() {
      if (triggerRef.current) {
        setPosition(calculateTooltipPosition(triggerRef.current.getBoundingClientRect()));
      }
    }

    function hideAfterOutsidePress(event: PointerEvent) {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return;
      }

      setPosition(null);
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", hideAfterOutsidePress);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", hideAfterOutsidePress);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => clearHideTimer();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={tooltipId}
        className={cn(
          "cursor-help decoration-dotted underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]",
          className,
        )}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onPointerEnter={showTooltip}
        onPointerLeave={scheduleTooltipHide}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            hideTooltip();
          }
        }}
      >
        {label}
      </button>
      {position
        ? createPortal(
            <span
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              style={{ left: position.left, top: position.top }}
              className="fixed z-50 w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
              onPointerEnter={clearHideTimer}
              onPointerLeave={scheduleTooltipHide}
            >
              {description}
            </span>,
            document.body,
          )
        : (
            <span id={tooltipId} className="sr-only">
              {description}
            </span>
          )}
    </>
  );
}

function calculateTooltipPosition(triggerRect: DOMRect): TooltipPosition {
  const margin = 16;
  const tooltipWidth = Math.min(224, window.innerWidth - margin * 2);
  const horizontalBoundary = tooltipWidth / 2 + margin;
  const center = triggerRect.left + triggerRect.width / 2;

  return {
    left: Math.min(
      Math.max(center, horizontalBoundary),
      window.innerWidth - horizontalBoundary,
    ),
    top: triggerRect.bottom + 8,
  };
}
