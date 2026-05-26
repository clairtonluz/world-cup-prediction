import { describe, expect, it } from "vitest";
import { createInviteToken, hashInviteToken } from "@/lib/league-invitations";
import { inviteTokenSchema } from "@/lib/validation";

describe("league invitations", () => {
  it("creates URL-safe invitation tokens accepted at the input boundary", () => {
    const token = createInviteToken();

    expect(inviteTokenSchema.parse(token)).toBe(token);
  });

  it("stores a stable digest rather than a usable invitation token", () => {
    const token = createInviteToken();
    const hash = hashInviteToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(token);
    expect(hashInviteToken(token)).toBe(hash);
  });
});
