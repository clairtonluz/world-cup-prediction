import { describe, expect, it } from "vitest";
import {
  parseMatchAgendaView,
  selectFocusedMatches,
  selectTeamTimelineFocusMatch,
} from "@/lib/match-focus";

describe("selectFocusedMatches", () => {
  it("shows every fixture from the first match day before the tournament", () => {
    const focused = selectFocusedMatches(
      [
        match("third", "2026-06-12T16:00:00-03:00"),
        match("first", "2026-06-11T16:00:00-03:00"),
        match("fourth", "2026-06-12T22:00:00-03:00"),
        match("second", "2026-06-11T23:00:00-03:00"),
        match("same-day-third", "2026-06-11T21:00:00-03:00"),
      ],
      new Date("2026-05-27T12:00:00-03:00"),
    );

    expect(focused.today).toEqual([]);
    expect(ids(focused.nextDay)).toEqual(["first", "same-day-third", "second"]);
  });

  it("places current-day matches in today and every fixture from the next match day in nextDay", () => {
    const focused = selectFocusedMatches(
      [
        match("previous", "2026-06-10T18:00:00-03:00"),
        match("today-first", "2026-06-11T16:00:00-03:00"),
        match("today-second", "2026-06-11T23:00:00-03:00"),
        match("next-day-second", "2026-06-12T22:00:00-03:00"),
        match("later", "2026-06-13T16:00:00-03:00"),
        match("next-day-first", "2026-06-12T16:00:00-03:00"),
      ],
      new Date("2026-06-11T20:00:00-03:00"),
    );

    expect(ids(focused.today)).toEqual(["today-first", "today-second"]);
    expect(ids(focused.nextDay)).toEqual(["next-day-first", "next-day-second"]);
  });

  it("skips rest days and shows every fixture from the next match day", () => {
    const focused = selectFocusedMatches(
      [
        match("oldest", "2026-07-04T14:00:00-03:00"),
        match("next-1", "2026-07-09T17:00:00-03:00"),
        match("next-2", "2026-07-09T20:00:00-03:00"),
        match("next-3", "2026-07-09T22:00:00-03:00"),
        match("later", "2026-07-14T16:00:00-03:00"),
      ],
      new Date("2026-07-08T12:00:00-03:00"),
    );

    expect(focused.today).toEqual([]);
    expect(ids(focused.nextDay)).toEqual(["next-1", "next-2", "next-3"]);
  });

  it("spans phases when the next match day crosses a knockout boundary", () => {
    const focused = selectFocusedMatches(
      [
        match("group-last", "2026-06-27T23:00:00-03:00", "GROUP_STAGE"),
        match("round-today", "2026-06-28T16:00:00-03:00", "ROUND_OF_32"),
        match("round-next", "2026-06-29T14:00:00-03:00", "ROUND_OF_32"),
      ],
      new Date("2026-06-28T10:00:00-03:00"),
    );

    expect(focused.today[0].stage).toBe("ROUND_OF_32");
    expect(focused.nextDay[0].stage).toBe("ROUND_OF_32");
  });

  it("returns no nextDay fixtures after the final", () => {
    const focused = selectFocusedMatches(
      [
        match("quarter", "2026-07-11T22:00:00-03:00"),
        match("semi-one", "2026-07-14T16:00:00-03:00"),
        match("semi-two", "2026-07-15T16:00:00-03:00"),
        match("final", "2026-07-19T16:00:00-03:00"),
      ],
      new Date("2026-07-20T12:00:00-03:00"),
    );

    expect(focused.today).toEqual([]);
    expect(focused.nextDay).toEqual([]);
  });

  it("groups midnight fixtures by the Brasilia calendar day", () => {
    const focused = selectFocusedMatches(
      [
        match("previous", "2026-06-11T02:59:00Z"),
        match("today-opening", "2026-06-11T03:00:00Z"),
        match("today-closing", "2026-06-12T02:59:00Z"),
        match("upcoming", "2026-06-12T03:00:00Z"),
      ],
      new Date("2026-06-11T12:00:00-03:00"),
    );

    expect(ids(focused.today)).toEqual(["today-opening", "today-closing"]);
    expect(ids(focused.nextDay)).toEqual(["upcoming"]);
  });
});

describe("parseMatchAgendaView", () => {
  it("accepts only a single all value", () => {
    expect(parseMatchAgendaView("all")).toBe("all");
    expect(parseMatchAgendaView(undefined)).toBe("focus");
    expect(parseMatchAgendaView("unexpected")).toBe("focus");
    expect(parseMatchAgendaView(["all", "focus"])).toBe("focus");
  });
});

describe("selectTeamTimelineFocusMatch", () => {
  it("prefers a started match over future matches", () => {
    const focused = selectTeamTimelineFocusMatch(
      [
        timelineMatch("future", "2026-06-15T16:00:00-03:00", "SCHEDULED"),
        timelineMatch("started", "2026-06-14T16:00:00-03:00", "STARTED"),
        timelineMatch("finished", "2026-06-10T16:00:00-03:00", "FINISHED"),
      ],
      new Date("2026-06-14T17:00:00-03:00"),
    );

    expect(focused?.id).toBe("started");
  });

  it("selects the next non-finished future match", () => {
    const focused = selectTeamTimelineFocusMatch(
      [
        timelineMatch("later", "2026-06-18T16:00:00-03:00", "SCHEDULED"),
        timelineMatch("past", "2026-06-10T16:00:00-03:00", "FINISHED"),
        timelineMatch("next", "2026-06-15T16:00:00-03:00", "SCHEDULED"),
      ],
      new Date("2026-06-14T12:00:00-03:00"),
    );

    expect(focused?.id).toBe("next");
  });

  it("falls back to the most recent past match", () => {
    const focused = selectTeamTimelineFocusMatch(
      [
        timelineMatch("oldest", "2026-06-10T16:00:00-03:00", "FINISHED"),
        timelineMatch("latest", "2026-06-12T16:00:00-03:00", "FINISHED"),
        timelineMatch("middle", "2026-06-11T16:00:00-03:00", "FINISHED"),
      ],
      new Date("2026-06-14T12:00:00-03:00"),
    );

    expect(focused?.id).toBe("latest");
  });

  it("returns no focus match for an empty timeline", () => {
    expect(selectTeamTimelineFocusMatch([])).toBeNull();
  });
});

function match(id: string, startsAt: string, stage = "GROUP_STAGE") {
  return { id, stage, startsAt: new Date(startsAt) };
}

function timelineMatch(
  id: string,
  startsAt: string,
  status: "SCHEDULED" | "STARTED" | "FINISHED",
) {
  return { id, startsAt: new Date(startsAt), status };
}

function ids(matches: { id: string }[]) {
  return matches.map((match) => match.id);
}
