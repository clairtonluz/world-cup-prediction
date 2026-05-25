import { describe, expect, it } from "vitest";
import { hasRole, isAdmin, isUser } from "@/lib/authorization";

describe("authorization role helpers", () => {
  it("allows USER participation without administration", () => {
    const user = { roles: ["USER"] as const };
    expect(isUser(user)).toBe(true);
    expect(isAdmin(user)).toBe(false);
  });

  it("treats ADMIN as a participating user", () => {
    const admin = { roles: ["ADMIN"] as const };
    expect(isAdmin(admin)).toBe(true);
    expect(isUser(admin)).toBe(true);
  });

  it("denies missing or unrelated roles", () => {
    expect(hasRole({ roles: [] }, "USER")).toBe(false);
    expect(isUser(undefined)).toBe(false);
  });
});
