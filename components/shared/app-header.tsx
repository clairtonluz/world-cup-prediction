import Link from "next/link";
import { signOutFromKeycloak } from "@/app/actions/auth";
import type { AppRole } from "@/lib/authorization";
import { TournamentBrand } from "@/components/shared/tournament-theme";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/shared/main-nav";

export function AppHeader({
  name,
  roles,
}: {
  name: string;
  roles: AppRole[];
}) {
  return (
    <header className="relative z-50 border-b border-white/10 bg-[#080b12]/90 text-white backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/matches"
          aria-label="Bolão da Copa - início"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]"
        >
          <TournamentBrand />
        </Link>

        <div className="flex items-center gap-2 lg:gap-8">
          <MainNav roles={roles} />

          <div className="flex items-center gap-3 border-l border-white/10 pl-2 lg:pl-0 lg:border-0">
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
      </div>
    </header>
  );
}
