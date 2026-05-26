import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { LeagueCreationForm } from "@/components/leagues/league-creation-form";
import { LeagueList } from "@/components/leagues/league-list";
import { MessageAlert } from "@/components/shared/message-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin } from "@/lib/authorization";
import { requireUser } from "@/lib/auth-guards";
import { listAdminLeagues, listMyLeagues } from "@/lib/data/leagues";

export const dynamic = "force-dynamic";

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { session } = await requireUser();
  const canAdministerLeagues = isAdmin(session.user);
  const [messages, leagues, adminLeagues] = await Promise.all([
    searchParams,
    listMyLeagues(),
    canAdministerLeagues ? listAdminLeagues() : Promise.resolve(null),
  ]);

  return (
    <AppShell>
      <MessageAlert {...messages} />
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Ligas</h1>
        <p className="mt-1 text-slate-600">
          Crie uma liga privada, convide amigos e acompanhe o ranking entre membros.
        </p>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader><CardTitle>Criar liga</CardTitle></CardHeader>
          <CardContent><LeagueCreationForm /></CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Minhas ligas</CardTitle></CardHeader>
            <CardContent>
              <LeagueList
                leagues={leagues}
                emptyMessage="Você ainda não participa de uma liga. Seu ranking global continua disponível."
              />
            </CardContent>
          </Card>
          {adminLeagues ? (
            <Card>
              <CardHeader><CardTitle>Ligas administradas</CardTitle></CardHeader>
              <CardContent>
                <LeagueList
                  leagues={adminLeagues}
                  emptyMessage="Não há outras ligas para administrar."
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
      <Link href="/ranking" className="text-sm font-medium text-emerald-700 hover:underline">
        Ver ranking global
      </Link>
    </AppShell>
  );
}
