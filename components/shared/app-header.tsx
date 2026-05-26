import Link from "next/link";
import { signOutFromKeycloak } from "@/app/actions/auth";
import { isAdmin } from "@/lib/authorization";
import type { AppRole } from "@/lib/authorization";
import { TournamentBrand } from "@/components/shared/tournament-theme";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { href: "/matches", label: "Jogos" },
  { href: "/grupos", label: "Grupos" },
  { href: "/ranking", label: "Ranking" },
  { href: "/ligas", label: "Ligas" },
  { href: "/pontuacao", label: "Pontuação" },
  { href: "/me", label: "Minhas estatísticas" },
];

const navigationLinkClassName =
  "whitespace-nowrap rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]";

export function AppHeader({
  name,
  roles,
}: {
  name: string;
  roles: AppRole[];
}) {
  return (
    <header className="relative border-b border-white/10 bg-[#080b12]/90 text-white backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/matches"
          aria-label="Bolão da Copa - início"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]"
        >
          <TournamentBrand />
        </Link>
        <nav
          className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-white/10 pt-3 text-sm text-slate-300 lg:order-none lg:w-auto lg:border-0 lg:pt-0"
          aria-label="Navegação principal"
        >
          {navigationItems.map((item) => (
            <Link key={item.href} className={navigationLinkClassName} href={item.href}>
              {item.label}
            </Link>
          ))}
          {isAdmin({ roles }) ? (
            <Link className={navigationLinkClassName} href="/admin/matches">
              Administração
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-300 sm:inline">{name}</span>
          <form action={signOutFromKeycloak}>
            <Button
              className="border-white/20 bg-white/[0.06] text-white hover:bg-white/10"
              type="submit"
              variant="outline"
              size="sm"
            >
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
