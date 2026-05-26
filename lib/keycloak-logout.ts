type KeycloakLogoutParameters = {
  issuer: string;
  clientId: string;
  postLogoutRedirectUri: string;
  idTokenHint?: string;
};

export function keycloakLogoutUrl({
  issuer,
  clientId,
  postLogoutRedirectUri,
  idTokenHint,
}: KeycloakLogoutParameters) {
  const logoutUrl = new URL(
    `${issuer.replace(/\/+$/, "")}/protocol/openid-connect/logout`,
  );

  logoutUrl.searchParams.set("client_id", clientId);
  logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);

  if (idTokenHint) {
    logoutUrl.searchParams.set("id_token_hint", idTokenHint);
  }

  return logoutUrl.toString();
}
