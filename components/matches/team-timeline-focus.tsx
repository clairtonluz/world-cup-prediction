"use client";

import { useEffect } from "react";

export function TeamTimelineFocus({ targetId }: { targetId: string | null }) {
  useEffect(() => {
    if (!targetId) {
      return;
    }

    const element = document.getElementById(targetId);
    if (!element) {
      return;
    }

    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [targetId]);

  return null;
}
