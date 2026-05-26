import { describe, expect, it } from "vitest";
import { keycloakLogoutUrl } from "@/lib/keycloak-logout";

describe("keycloakLogoutUrl", () => {
  it("builds an RP-initiated logout redirect with an ID token hint", () => {
    const url = new URL(
      keycloakLogoutUrl({
        issuer: "https://identity.example/realms/predictor/",
        clientId: "world-cup-predictor-web",
        postLogoutRedirectUri: "https://predictor.example",
        idTokenHint: "signed-id-token",
      }),
    );

    expect(url.toString()).toContain(
      "https://identity.example/realms/predictor/protocol/openid-connect/logout",
    );
    expect(url.searchParams.get("client_id")).toBe("world-cup-predictor-web");
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe(
      "https://predictor.example",
    );
    expect(url.searchParams.get("id_token_hint")).toBe("signed-id-token");
  });

  it("supports existing sessions without a stored ID token hint", () => {
    const url = new URL(
      keycloakLogoutUrl({
        issuer: "https://identity.example/realms/predictor",
        clientId: "world-cup-predictor-web",
        postLogoutRedirectUri: "https://predictor.example",
      }),
    );

    expect(url.searchParams.has("id_token_hint")).toBe(false);
    expect(url.searchParams.get("client_id")).toBe("world-cup-predictor-web");
  });
});
