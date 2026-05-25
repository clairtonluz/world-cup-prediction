import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { getDb } from "@/lib/db";
import type { AppRole } from "@/lib/authorization";

declare module "next-auth" {
  interface Session {
    error?: "AccessTokenExpired";
    user: {
      id: string;
      roles: AppRole[];
      name?: string | null;
    };
  }
}

type AppToken = {
  userId?: string;
  roles?: AppRole[];
  accessTokenExpires?: number;
  error?: "AccessTokenExpired";
};

function requiredAuthSetting(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Keycloak authentication`);
  }
  return value;
}

function applicationRoles(payload: JWTPayload): AppRole[] {
  const realmAccess = payload.realm_access;
  if (!realmAccess || typeof realmAccess !== "object") {
    return [];
  }

  const roles = (realmAccess as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter(
    (role): role is AppRole => role === "USER" || role === "ADMIN",
  );
}

async function verifiedIdentity(accessToken: string) {
  const issuer = requiredAuthSetting("AUTH_KEYCLOAK_ISSUER");
  const audience = requiredAuthSetting("AUTH_KEYCLOAK_ID");
  const jwks = createRemoteJWKSet(
    new URL(`${issuer}/protocol/openid-connect/certs`),
  );
  const { payload } = await jwtVerify(accessToken, jwks, {
    issuer,
    audience,
  });

  if (!payload.sub) {
    throw new Error("Keycloak access token is missing a subject");
  }

  return { keycloakId: payload.sub, roles: applicationRoles(payload) };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID ?? "",
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET ?? "",
      issuer: process.env.AUTH_KEYCLOAK_ISSUER ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  callbacks: {
    async signIn({ account }) {
      if (!account?.access_token) {
        return false;
      }

      const identity = await verifiedIdentity(account.access_token);
      return identity.roles.includes("USER") || identity.roles.includes("ADMIN");
    },
    async jwt({ token, account, profile }) {
      const appToken = token as typeof token & AppToken;

      if (account) {
        if (!account.access_token || !account.expires_at) {
          throw new Error("Keycloak did not supply an expiring access token");
        }

        const identity = await verifiedIdentity(account.access_token);
        appToken.roles = identity.roles;
        appToken.accessTokenExpires = account.expires_at * 1000;
        appToken.error = undefined;

        const name =
          typeof profile?.name === "string"
            ? profile.name
            : typeof profile?.preferred_username === "string"
              ? profile.preferred_username
              : "Participant";

        const user = await getDb().user.upsert({
          where: { keycloakId: identity.keycloakId },
          update: {
            name,
            email: typeof profile?.email === "string" ? profile.email : null,
            image: typeof profile?.picture === "string" ? profile.picture : null,
          },
          create: {
            keycloakId: identity.keycloakId,
            name,
            email: typeof profile?.email === "string" ? profile.email : null,
            image: typeof profile?.picture === "string" ? profile.picture : null,
          },
        });
        appToken.userId = user.id;
      }

      if (
        typeof appToken.accessTokenExpires === "number" &&
        Date.now() >= appToken.accessTokenExpires
      ) {
        appToken.error = "AccessTokenExpired";
      }

      return appToken;
    },
    async session({ session, token }) {
      const appToken = token as typeof token & AppToken;
      if (session.user && typeof appToken.userId === "string") {
        // Auth.js adapter types retain profile fields that this JWT session does not expose.
        session.user = {
          id: appToken.userId,
          roles: appToken.roles ?? [],
          name: session.user.name,
        } as typeof session.user;
        session.error = appToken.error;
      }
      return session;
    },
  },
});
