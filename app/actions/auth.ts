"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { requiredAuthSetting, signOut } from "@/auth";
import { keycloakLogoutUrl } from "@/lib/keycloak-logout";

async function keycloakIdTokenHint() {
  const applicationUrl = new URL(requiredAuthSetting("AUTH_URL"));
  const token = await getToken({
    req: { headers: await headers() },
    secret: requiredAuthSetting("AUTH_SECRET"),
    secureCookie: applicationUrl.protocol === "https:",
  });

  return typeof token?.keycloakIdToken === "string"
    ? token.keycloakIdToken
    : undefined;
}

export async function signOutFromKeycloak() {
  const postLogoutRedirectUri = new URL(
    requiredAuthSetting("AUTH_URL"),
  ).origin;
  const logoutUrl = keycloakLogoutUrl({
    issuer: requiredAuthSetting("AUTH_KEYCLOAK_ISSUER"),
    clientId: requiredAuthSetting("AUTH_KEYCLOAK_ID"),
    postLogoutRedirectUri,
    idTokenHint: await keycloakIdTokenHint(),
  });

  await signOut({ redirect: false });
  redirect(logoutUrl);
}
