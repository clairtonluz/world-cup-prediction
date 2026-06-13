import { describe, expect, it, vi } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import {
  authSessionConfig,
  SESSION_INACTIVITY_TIMEOUT_SECONDS,
} from "@/lib/auth-session";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/auth";
import { config, proxy } from "@/proxy";

function doesProxyMatch(url: string, headers?: Record<string, string>) {
  return unstable_doesMiddlewareMatch({
    config,
    url,
    headers,
    nextConfig: {},
  });
}

describe("auth session policy", () => {
  it("uses a 12-hour inactivity timeout for JWT sessions", () => {
    expect(SESSION_INACTIVITY_TIMEOUT_SECONDS).toBe(12 * 60 * 60);
    expect(authSessionConfig).toMatchObject({
      strategy: "jwt",
      maxAge: SESSION_INACTIVITY_TIMEOUT_SECONDS,
    });
  });

  it("uses Auth.js proxy handling to refresh matched page sessions", () => {
    expect(proxy).toBe(auth);
  });
});

describe("auth session proxy matcher", () => {
  it("runs for real site page requests", () => {
    expect(doesProxyMatch("/")).toBe(true);
    expect(doesProxyMatch("/matches")).toBe(true);
    expect(doesProxyMatch("/grupos-de-amigos/abc")).toBe(true);
  });

  it("skips API routes, framework routes, and static asset paths", () => {
    expect(doesProxyMatch("/api/auth/session")).toBe(false);
    expect(doesProxyMatch("/_next/static/chunks/app.js")).toBe(false);
    expect(doesProxyMatch("/_next/image?url=%2Fflags%2FBRA.png")).toBe(false);
    expect(doesProxyMatch("/favicon.ico")).toBe(false);
    expect(doesProxyMatch("/flags/BRA.png")).toBe(false);
  });

  it("skips passive prefetch requests", () => {
    expect(doesProxyMatch("/matches", { "next-router-prefetch": "1" })).toBe(
      false,
    );
    expect(doesProxyMatch("/matches", { purpose: "prefetch" })).toBe(false);
    expect(doesProxyMatch("/matches", { "sec-purpose": "prefetch" })).toBe(
      false,
    );
  });
});
