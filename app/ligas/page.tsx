import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { LeagueCreationForm } from "@/components/leagues/league-creation-form";
import { MessageAlert } from "@/components/shared/message-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMyLeagues } from "@/lib/data/leagues";

export const dynamic = "force-dynamic";

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [messages, leagues] = await Promise.all([searchParams, listMyLeagues()]);

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
        <Card>
          <CardHeader><CardTitle>Minhas ligas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/ligas/${league.id}`}
                className="block rounded-lg border border-slate-200 p-4 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <strong className="text-slate-950">{league.name}</strong>
                  <span className="text-sm text-slate-600">
                    {league.memberCount} {league.memberCount === 1 ? "membro" : "membros"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Criada por {league.ownerName}{league.isOwner ? " (você)" : ""}
                </p>
              </Link>
            ))}
            {leagues.length === 0 ? (
              <p className="text-sm text-slate-600">
                Você ainda não participa de uma liga. Seu ranking global continua disponível.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>
      <Link href="/ranking" className="text-sm font-medium text-emerald-700 hover:underline">
        Ver ranking global
      </Link>
    </AppShell>
  );
}
