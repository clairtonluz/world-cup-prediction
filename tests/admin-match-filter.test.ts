import { describe, expect, it } from "vitest";
import {
  filterAdminMatches,
  parseAdminMatchAgendaView,
} from "@/lib/admin-match-filter";

describe("parseAdminMatchAgendaView", () => {
  it("accepts only the all view", () => {
    expect(parseAdminMatchAgendaView("all")).toBe("all");
    expect(parseAdminMatchAgendaView(undefined)).toBe("current");
    expect(parseAdminMatchAgendaView("unexpected")).toBe("current");
    expect(parseAdminMatchAgendaView(["all", "current"])).toBe("current");
  });
});

describe("filterAdminMatches", () => {
  const referenceTime = new Date("2026-06-12T12:00:00Z");

  it("hides matches from yesterday or earlier by default", () => {
    const matches = [
      match("older", "2026-06-10T20:00:00Z"),
      match("yesterday", "2026-06-11T20:00:00Z"),
      match("today", "2026-06-12T09:00:00Z"),
    ];

    expect(
      filterAdminMatches(matches, {
        view: "current",
        referenceTime,
        timeZone: "UTC",
      }).map((fixture) => fixture.id),
    ).toEqual(["today"]);
  });

  it("keeps today and future matches by default", () => {
    const matches = [
      match("today-finished", "2026-06-12T09:00:00Z"),
      match("tomorrow", "2026-06-13T09:00:00Z"),
    ];

    expect(
      filterAdminMatches(matches, {
        view: "current",
        referenceTime,
        timeZone: "UTC",
      }).map((fixture) => fixture.id),
    ).toEqual(["today-finished", "tomorrow"]);
  });

  it("keeps all matches when the all view is selected", () => {
    const matches = [
      match("yesterday", "2026-06-11T20:00:00Z"),
      match("today", "2026-06-12T09:00:00Z"),
    ];

    expect(
      filterAdminMatches(matches, {
        view: "all",
        referenceTime,
        timeZone: "UTC",
      }).map((fixture) => fixture.id),
    ).toEqual(["yesterday", "today"]);
  });

  it("uses the browser timezone day when deciding whether a match is past", () => {
    const matches = [
      match("previous-local-day", "2026-06-12T02:59:00Z"),
      match("current-local-day", "2026-06-12T03:00:00Z"),
    ];

    expect(
      filterAdminMatches(matches, {
        view: "current",
        referenceTime: new Date("2026-06-12T12:00:00Z"),
        timeZone: "America/Fortaleza",
      }).map((fixture) => fixture.id),
    ).toEqual(["current-local-day"]);
  });
});

function match(id: string, startsAt: string) {
  return {
    id,
    startsAt: new Date(startsAt),
  };
}
