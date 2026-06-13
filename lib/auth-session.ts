import type { NextAuthConfig } from "next-auth";

export const SESSION_INACTIVITY_TIMEOUT_SECONDS = 12 * 60 * 60;

export const authSessionConfig = {
  strategy: "jwt",
  maxAge: SESSION_INACTIVITY_TIMEOUT_SECONDS,
} satisfies NonNullable<NextAuthConfig["session"]>;
