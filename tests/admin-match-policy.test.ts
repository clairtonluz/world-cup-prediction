import { describe, expect, it } from "vitest";
import { newMatchError, updatedMatchError } from "@/lib/admin-match-policy";

const scheduledMatch = {
  teamA: "Brazil",
  teamB: "Belgium",
  stage: "GROUP_STAGE" as const,
  startsAt: new Date("2026-06-15T19:00:00Z"),
  status: "SCHEDULED" as const,
};

describe("newMatchError", () => {
  it("only allows a newly created scheduled fixture", () => {
    expect(newMatchError(scheduledMatch)).toBeNull();
    expect(newMatchError({ ...scheduledMatch, status: "STARTED" })).toBe(
      "new_match_must_be_scheduled",
    );
    expect(newMatchError({ ...scheduledMatch, status: "FINISHED" })).toBe(
      "new_match_must_be_scheduled",
    );
  });
});

describe("updatedMatchError", () => {
  it("locks fixture identity and kickoff once predictions are closed", () => {
    expect(
      updatedMatchError(
        scheduledMatch,
        { ...scheduledMatch, teamA: "Argentina" },
        scheduledMatch.startsAt,
      ),
    ).toBe("fixture_locked");
  });

  it("allows final result entry without changing a locked fixture", () => {
    expect(
      updatedMatchError(
        { ...scheduledMatch, status: "STARTED" },
        { ...scheduledMatch, status: "FINISHED" },
      ),
    ).toBeNull();
  });

  it("does not allow started or finished matches to move backwards", () => {
    expect(
      updatedMatchError(
        { ...scheduledMatch, status: "STARTED" },
        scheduledMatch,
      ),
    ).toBe("started_match_locked");
    expect(
      updatedMatchError(
        { ...scheduledMatch, status: "FINISHED" },
        { ...scheduledMatch, status: "STARTED" },
      ),
    ).toBe("finished_match_locked");
  });
});
