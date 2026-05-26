import { describe, expect, it } from "vitest";
import { feedbackText, feedbackUrl } from "@/lib/feedback";

describe("feedbackText", () => {
  it("renders known action results", () => {
    expect(feedbackText({ success: "prediction_saved" })).toEqual({
      kind: "success",
      text: "Aposta salva.",
    });
  });

  it("ignores arbitrary query-string messages", () => {
    expect(feedbackText({ error: "Administrator access granted." })).toBeNull();
  });
});

describe("feedbackUrl", () => {
  it("adds a defined feedback code instead of display text", () => {
    expect(feedbackUrl("/matches", { error: "predictions_closed" })).toBe(
      "/matches?error=predictions_closed",
    );
  });
});
