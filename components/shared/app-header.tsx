import Link from "next/link";
import { Trophy } from "lucide-react";
import { signOut } from "@/auth";
import { isAdmin } from "@/lib/authorization";
import type { AppRole } from "@/lib/authorization";
import { Button } from "@/components/ui/button";

export function AppHeader({
  name,
  roles,
}: {
  name: string;
  roles: AppRole[];
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/matches" className="flex items-center gap-2 font-semibold text-slate-950">
          <Trophy className="size-5 text-emerald-700" />
          Bolão da Copa
        </Link>
        <nav className="flex items-center gap-1 text-sm" aria-label="Navegação principal">
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/matches">
            Jogos
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/grupos">
            Grupos
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/ranking">
            Ranking
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/ligas">
            Ligas
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/pontuacao">
            Pontuação
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/me">
            Minhas estatísticas
          </Link>
          {isAdmin({ roles }) ? (
            <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/admin/matches">
              Administração
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">{name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
