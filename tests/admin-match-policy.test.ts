import { describe, expect, it } from "vitest";
import {
  matchStartUpdateError,
  updatedMatchError,
} from "@/lib/admin-match-policy";

describe("updatedMatchError", () => {
  it("allows status progression and result corrections", () => {
    expect(updatedMatchError({ status: "SCHEDULED" }, { status: "STARTED" })).toBeNull();
    expect(updatedMatchError({ status: "STARTED" }, { status: "FINISHED" })).toBeNull();
    expect(updatedMatchError({ status: "FINISHED" }, { status: "FINISHED" })).toBeNull();
  });

  it("does not allow live or finished matches to move backwards", () => {
    expect(updatedMatchError({ status: "STARTED" }, { status: "SCHEDULED" })).toBe(
      "started_match_locked",
    );
    expect(updatedMatchError({ status: "FINISHED" }, { status: "STARTED" })).toBe(
      "finished_match_locked",
    );
  });
});

describe("matchStartUpdateError", () => {
  it("allows scheduled and started matches to change start datetime", () => {
    expect(matchStartUpdateError({ status: "SCHEDULED" })).toBeNull();
    expect(matchStartUpdateError({ status: "STARTED" })).toBeNull();
  });

  it("rejects start datetime changes after a match is finished", () => {
    expect(matchStartUpdateError({ status: "FINISHED" })).toBe(
      "finished_match_locked",
    );
  });
});
