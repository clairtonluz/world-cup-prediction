import { describe, expect, it } from "vitest";
import { resolveAnalyticsPage } from "@/lib/analytics-routes";

describe("resolveAnalyticsPage", () => {
  it("classifies every current page route without exposing dynamic values", () => {
    const currentPages = [
      "/",
      "/login",
      "/matches",
      "/matches/42",
      "/jogadores/42",
      "/apostas",
      "/ranking",
      "/pontuacao",
      "/me",
      "/grupos",
      "/grupos-de-amigos",
      "/grupos-de-amigos/friends-id",
      "/grupos-de-amigos/convite/private-token-value",
      "/admin/matches",
      "/admin/matches/new",
      "/admin/matches/42/edit",
      "/admin/users",
    ];

    for (const pathname of currentPages) {
      expect(resolveAnalyticsPage(pathname)).not.toBeNull();
    }
  });

  it("tracks known static pages by safe fixed path", () => {
    expect(resolveAnalyticsPage("/matches")).toEqual({
      path: "/matches",
      title: "Jogos",
    });
    expect(resolveAnalyticsPage("/admin/users")).toEqual({
      path: "/admin/users",
      title: "Administrar usuários",
    });
  });

  it("replaces sensitive and identifying dynamic path segments", () => {
    expect(resolveAnalyticsPage("/matches/42")).toEqual({
      path: "/matches/[id]",
      title: "Detalhes do jogo",
    });
    expect(resolveAnalyticsPage("/jogadores/42")).toEqual({
      path: "/jogadores/[id]",
      title: "Pontuação do jogador",
    });
    expect(resolveAnalyticsPage("/grupos-de-amigos/convite/private-token-value")).toEqual({
      path: "/grupos-de-amigos/convite/[token]",
      title: "Convite para grupo",
    });
    expect(resolveAnalyticsPage("/grupos-de-amigos/friends-id")).toEqual({
      path: "/grupos-de-amigos/[id]",
      title: "Detalhes do grupo",
    });
  });

  it("does not report unclassified paths or query-bearing input", () => {
    expect(resolveAnalyticsPage("/admin/users?q=person@example.com")).toBeNull();
    expect(resolveAnalyticsPage("/private/unclassified-value")).toBeNull();
  });

  it("reports the rendered not-found state without its requested raw path", () => {
    expect(resolveAnalyticsPage("/private/unclassified-value", true)).toEqual({
      path: "/not-found",
      title: "Página não encontrada",
    });
  });
});
