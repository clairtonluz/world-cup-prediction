import { describe, expect, it } from "vitest";
import {
  parseMatchAgendaView,
  selectFocusedMatches,
} from "@/lib/match-focus";

describe("selectFocusedMatches", () => {
  it("shows the first three fixtures as upcoming before the tournament", () => {
    const focused = selectFocusedMatches(
      [
        match("third", "2026-06-12T16:00:00-03:00"),
        match("first", "2026-06-11T16:00:00-03:00"),
        match("fourth", "2026-06-12T22:00:00-03:00"),
        match("second", "2026-06-11T23:00:00-03:00"),
      ],
      new Date("2026-05-27T12:00:00-03:00"),
    );

    expect(focused.today).toEqual([]);
    expect(focused.previous).toEqual([]);
    expect(ids(focused.upcoming)).toEqual(["first", "second", "third"]);
  });

  it("places every match on the current Brasilia day only in today's group", () => {
    const focused = selectFocusedMatches(
      [
        match("previous", "2026-06-10T18:00:00-03:00"),
        match("today-first", "2026-06-11T16:00:00-03:00"),
        match("today-second", "2026-06-11T23:00:00-03:00"),
        match("upcoming", "2026-06-12T16:00:00-03:00"),
      ],
      new Date("2026-06-11T20:00:00-03:00"),
    );

    expect(ids(focused.today)).toEqual(["today-first", "today-second"]);
    expect(ids(focused.previous)).toEqual(["previous"]);
    expect(ids(focused.upcoming)).toEqual(["upcoming"]);
  });

  it("uses the three closest fixtures on each side of the current time on a rest day", () => {
    const focused = selectFocusedMatches(
      [
        match("oldest", "2026-07-04T14:00:00-03:00"),
        match("previous-3", "2026-07-05T17:00:00-03:00"),
        match("previous-2", "2026-07-06T16:00:00-03:00"),
        match("previous-1", "2026-07-07T17:00:00-03:00"),
        match("next-1", "2026-07-09T17:00:00-03:00"),
        match("next-2", "2026-07-10T16:00:00-03:00"),
        match("next-3", "2026-07-11T18:00:00-03:00"),
        match("later", "2026-07-14T16:00:00-03:00"),
      ],
      new Date("2026-07-08T12:00:00-03:00"),
    );

    expect(ids(focused.previous)).toEqual([
      "previous-1",
      "previous-2",
      "previous-3",
    ]);
    expect(ids(focused.upcoming)).toEqual(["next-1", "next-2", "next-3"]);
  });

  it("spans phases when the closest fixtures cross a knockout boundary", () => {
    const focused = selectFocusedMatches(
      [
        match("group-last", "2026-06-27T23:00:00-03:00", "GROUP_STAGE"),
        match("round-today", "2026-06-28T16:00:00-03:00", "ROUND_OF_32"),
        match("round-next", "2026-06-29T14:00:00-03:00", "ROUND_OF_32"),
      ],
      new Date("2026-06-28T10:00:00-03:00"),
    );

    expect(focused.previous[0].stage).toBe("GROUP_STAGE");
    expect(focused.today[0].stage).toBe("ROUND_OF_32");
    expect(focused.upcoming[0].stage).toBe("ROUND_OF_32");
  });

  it("shows only the latest three fixtures as previous after the final", () => {
    const focused = selectFocusedMatches(
      [
        match("quarter", "2026-07-11T22:00:00-03:00"),
        match("semi-one", "2026-07-14T16:00:00-03:00"),
        match("semi-two", "2026-07-15T16:00:00-03:00"),
        match("final", "2026-07-19T16:00:00-03:00"),
      ],
      new Date("2026-07-20T12:00:00-03:00"),
    );

    expect(ids(focused.previous)).toEqual(["final", "semi-two", "semi-one"]);
    expect(focused.today).toEqual([]);
    expect(focused.upcoming).toEqual([]);
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
    expect(ids(focused.previous)).toEqual(["previous"]);
    expect(ids(focused.upcoming)).toEqual(["upcoming"]);
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

function match(id: string, startsAt: string, stage = "GROUP_STAGE") {
  return { id, stage, startsAt: new Date(startsAt) };
}

function ids(matches: { id: string }[]) {
  return matches.map((match) => match.id);
}
