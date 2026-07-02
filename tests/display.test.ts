import { describe, expect, it } from "vitest";
import { formatDateTime, formatMatchDate, matchDayKey } from "@/lib/display";

describe("date display", () => {
  const kickoff = new Date("2026-06-11T19:00:00Z");

  it("formats match dates in an injected browser timezone", () => {
    expect(
      formatMatchDate(kickoff, { timeZone: "America/Fortaleza" }),
    ).toBe("qui., 11 de jun. de 2026, 16:00");
    expect(formatMatchDate(kickoff, { timeZone: "UTC" })).toBe(
      "qui., 11 de jun. de 2026, 19:00",
    );
  });

  it("keeps generic timestamps without the weekday in the browser timezone", () => {
    expect(
      formatDateTime(kickoff, { timeZone: "America/Fortaleza" }),
    ).toBe("11 de jun. de 2026, 16:00");
    expect(formatDateTime(kickoff, { timeZone: "UTC" })).toBe(
      "11 de jun. de 2026, 19:00",
    );
  });

  it("keys match days by the injected browser timezone", () => {
    const lateNightKickoff = new Date("2026-06-12T02:59:00Z");

    expect(matchDayKey(lateNightKickoff, "America/Fortaleza")).toBe(
      "2026-06-11",
    );
    expect(matchDayKey(lateNightKickoff, "UTC")).toBe("2026-06-12");
  });
});
