import Link from "next/link";
import {
  deleteLeagueAction,
  disableLeagueInviteAction,
  leaveLeagueAction,
  removeLeagueMemberAction,
} from "@/actions/league-actions";
import { InviteControls } from "@/components/leagues/invite-controls";
import { RankingTable } from "@/components/ranking/ranking-table";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeagueDetail } from "@/lib/data/leagues";

export const dynamic = "force-dynamic";

export default async function LeagueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const league = await getLeagueDetail(id);

  return (
    <AppShell>
      <Link href="/ligas" className="text-sm font-medium text-emerald-700 hover:underline">
        Voltar para ligas
      </Link>
      <MessageAlert {...messages} />
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">{league.name}</h1>
        <p className="mt-1 text-slate-600">
          Ranking privado de {league.members.length} {league.members.length === 1 ? "membro" : "membros"}.
          {" "}{league.ranking.provisional ? "Classificação provisória com jogos ao vivo. " : ""}
          Desempates por pontos, placares exatos, vencedores corretos e nome.
        </p>
      </section>
      {league.ranking.currentUser ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">Minha posição na liga</p><p className="text-3xl font-semibold">#{league.ranking.currentUser.position}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">{league.ranking.provisional ? "Pontos provisórios" : "Total de pontos"}</p><p className="text-3xl font-semibold">{league.ranking.currentUser.totalPoints}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">Placares exatos</p><p className="text-3xl font-semibold">{league.ranking.currentUser.exactPredictions}</p></CardContent></Card>
        </div>
      ) : null}
      <Card>
        <CardHeader><CardTitle>Ranking da liga</CardTitle></CardHeader>
        <CardContent><RankingTable rows={league.ranking.rows} /></CardContent>
      </Card>
      {league.canManage ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Convidar amigos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InviteControls leagueId={league.id} invitationEnabled={league.invitationEnabled} />
              {league.invitationEnabled ? (
                <form action={disableLeagueInviteAction.bind(null, league.id)}>
                  <Button type="submit" variant="ghost">Desativar convite atual</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Gerenciar membros</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {league.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <span>{member.name}{member.isOwner ? " (criador)" : ""}</span>
                  {!member.isOwner ? (
                    <form action={removeLeagueMemberAction.bind(null, league.id, member.id)}>
                      <Button type="submit" variant="ghost" size="sm">Remover</Button>
                    </form>
                  ) : null}
                </div>
              ))}
              <form action={deleteLeagueAction.bind(null, league.id)} className="pt-3">
                <Button type="submit" variant="outline">Excluir liga</Button>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : null}
      {league.isMember && !league.isOwner ? (
        <Card className="max-w-md">
          <CardHeader><CardTitle>Participação</CardTitle></CardHeader>
          <CardContent>
            <form action={leaveLeagueAction.bind(null, league.id)}>
              <Button type="submit" variant="outline">Sair da liga</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}
