import { describe, expect, it } from "vitest";
import { formatDateTime, formatMatchDate } from "@/lib/display";

describe("date display", () => {
  const kickoff = new Date("2026-06-11T19:00:00Z");

  it("shows the short weekday for match dates", () => {
    expect(formatMatchDate(kickoff)).toBe("qui., 11 de jun. de 2026, 16:00");
  });

  it("keeps generic timestamps without the weekday", () => {
    expect(formatDateTime(kickoff)).toBe("11 de jun. de 2026, 16:00");
  });
});
