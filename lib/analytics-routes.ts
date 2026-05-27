export type AnalyticsPage = Readonly<{
  path: string;
  title: string;
}>;

const NOT_FOUND_PAGE: AnalyticsPage = {
  path: "/not-found",
  title: "Página não encontrada",
};

const exactPages: Readonly<Record<string, AnalyticsPage>> = {
  "/": { path: "/", title: "Página inicial" },
  "/login": { path: "/login", title: "Entrar" },
  "/matches": { path: "/matches", title: "Jogos" },
  "/apostas": { path: "/apostas", title: "Apostas" },
  "/ranking": { path: "/ranking", title: "Ranking" },
  "/pontuacao": { path: "/pontuacao", title: "Pontuação" },
  "/me": { path: "/me", title: "Meu perfil" },
  "/grupos": { path: "/grupos", title: "Grupos" },
  "/grupos-de-amigos": { path: "/grupos-de-amigos", title: "Grupos de Amigos" },
  "/admin/matches": { path: "/admin/matches", title: "Administrar jogos" },
  "/admin/matches/new": { path: "/admin/matches/new", title: "Novo jogo" },
  "/admin/users": { path: "/admin/users", title: "Administrar usuários" },
};

const dynamicPages: ReadonlyArray<{
  pattern: RegExp;
  page: AnalyticsPage;
}> = [
  {
    pattern: /^\/matches\/[^/]+$/,
    page: { path: "/matches/[id]", title: "Detalhes do jogo" },
  },
  {
    pattern: /^\/grupos-de-amigos\/convite\/[^/]+$/,
    page: { path: "/grupos-de-amigos/convite/[token]", title: "Convite para grupo" },
  },
  {
    pattern: /^\/grupos-de-amigos\/[^/]+$/,
    page: { path: "/grupos-de-amigos/[id]", title: "Detalhes do grupo" },
  },
  {
    pattern: /^\/admin\/matches\/[^/]+\/edit$/,
    page: { path: "/admin/matches/[id]/edit", title: "Editar jogo" },
  },
];

export function resolveAnalyticsPage(pathname: string, isNotFound = false): AnalyticsPage | null {
  if (isNotFound) {
    return NOT_FOUND_PAGE;
  }

  const exactPage = exactPages[pathname];
  if (exactPage) {
    return exactPage;
  }

  return dynamicPages.find(({ pattern }) => pattern.test(pathname))?.page ?? null;
}
