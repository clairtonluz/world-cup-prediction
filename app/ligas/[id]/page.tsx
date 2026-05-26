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
import { ConfirmationForm } from "@/components/shared/confirmation-form";
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
                    <ConfirmationForm
                      action={removeLeagueMemberAction.bind(null, league.id, member.id)}
                      confirmation={{
                        title: "Remover participante?",
                        description: `${member.name} será removido da liga e o convite atual será desativado.`,
                        confirmLabel: "Remover",
                        intent: "danger",
                      }}
                    >
                      <Button type="submit" variant="destructive" size="sm">Remover</Button>
                    </ConfirmationForm>
                  ) : null}
                </div>
              ))}
              <ConfirmationForm
                action={deleteLeagueAction.bind(null, league.id)}
                confirmation={{
                  title: "Excluir liga?",
                  description: `A liga "${league.name}" será excluída permanentemente. Esta ação não pode ser desfeita.`,
                  confirmLabel: "Excluir liga",
                  intent: "danger",
                }}
                className="pt-3"
              >
                <Button type="submit" variant="destructive">Excluir liga</Button>
              </ConfirmationForm>
            </CardContent>
          </Card>
        </section>
      ) : null}
      {league.isMember && !league.isOwner ? (
        <Card className="max-w-md">
          <CardHeader><CardTitle>Participação</CardTitle></CardHeader>
          <CardContent>
            <ConfirmationForm
              action={leaveLeagueAction.bind(null, league.id)}
              confirmation={{
                title: "Sair da liga?",
                description: `Você sairá da liga "${league.name}" e precisará de um novo convite para voltar.`,
                confirmLabel: "Sair da liga",
                intent: "danger",
              }}
            >
              <Button type="submit" variant="destructive">Sair da liga</Button>
            </ConfirmationForm>
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}
