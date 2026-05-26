import Link from "next/link";
import type { AppRole } from "@/lib/authorization";
import { TournamentBrand } from "@/components/shared/tournament-theme";
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

        <MainNav roles={roles} name={name} />
      </div>
    </header>
  );
}
