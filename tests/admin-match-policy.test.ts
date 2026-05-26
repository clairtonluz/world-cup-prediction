import { describe, expect, it } from "vitest";
import { updatedMatchError } from "@/lib/admin-match-policy";

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
