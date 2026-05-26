import { describe, expect, it } from "vitest";
import { feedbackText, feedbackUrl } from "@/lib/feedback";

describe("feedbackText", () => {
  it("renders known action results", () => {
    expect(feedbackText({ success: "prediction_saved" })).toEqual({
      kind: "success",
      text: "Aposta salva.",
    });
  });

  it("renders friend group action results without accepting arbitrary text", () => {
    expect(feedbackText({ success: "friend_group_joined" })).toEqual({
      kind: "success",
      text: "Você entrou no Grupo de Amigos.",
    });
    expect(feedbackText({ error: "invite_invalid" })).toEqual({
      kind: "error",
      text: "Este convite não existe mais ou foi desativado.",
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
