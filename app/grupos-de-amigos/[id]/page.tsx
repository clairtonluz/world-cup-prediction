import Link from "next/link";
import {
  deleteFriendGroupAction,
  disableFriendGroupInviteAction,
  leaveFriendGroupAction,
  removeFriendGroupMemberAction,
} from "@/actions/friend-group-actions";
import { InviteControls } from "@/components/friend-groups/invite-controls";
import { RankingTable } from "@/components/ranking/ranking-table";
import { AppShell } from "@/components/shared/app-shell";
import { ConfirmationForm } from "@/components/shared/confirmation-form";
import { MessageAlert } from "@/components/shared/message-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFriendGroupDetail } from "@/lib/data/friend-groups";

export const dynamic = "force-dynamic";

export default async function FriendGroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const friendGroup = await getFriendGroupDetail(id);

  return (
    <AppShell>
      <Link href="/grupos-de-amigos" className="text-sm font-medium text-emerald-700 hover:underline">
        Voltar para Grupos de Amigos
      </Link>
      <MessageAlert {...messages} />
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">{friendGroup.name}</h1>
        <p className="mt-1 text-slate-600">
          Ranking privado de {friendGroup.members.length} {friendGroup.members.length === 1 ? "membro" : "membros"}.
          {" "}{friendGroup.ranking.provisional ? "Classificação provisória com jogos ao vivo. " : ""}
          Desempates por pontos, placares exatos, vencedores corretos e nome.
        </p>
      </section>
      {friendGroup.ranking.currentUser ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">Minha posição no Grupo de Amigos</p><p className="text-3xl font-semibold">#{friendGroup.ranking.currentUser.position}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">{friendGroup.ranking.provisional ? "Pontos provisórios" : "Total de pontos"}</p><p className="text-3xl font-semibold">{friendGroup.ranking.currentUser.totalPoints}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-sm text-slate-600">Placares exatos</p><p className="text-3xl font-semibold">{friendGroup.ranking.currentUser.exactPredictions}</p></CardContent></Card>
        </div>
      ) : null}
      <Card>
        <CardHeader><CardTitle>Ranking do Grupo de Amigos</CardTitle></CardHeader>
        <CardContent><RankingTable rows={friendGroup.ranking.rows} /></CardContent>
      </Card>
      {friendGroup.canManage ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Convidar amigos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InviteControls friendGroupId={friendGroup.id} invitationEnabled={friendGroup.invitationEnabled} />
              {friendGroup.invitationEnabled ? (
                <form action={disableFriendGroupInviteAction.bind(null, friendGroup.id)}>
                  <Button type="submit" variant="ghost">Desativar convite atual</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Gerenciar membros</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {friendGroup.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <span>{member.name}{member.isOwner ? " (criador)" : ""}</span>
                  {!member.isOwner ? (
                    <ConfirmationForm
                      action={removeFriendGroupMemberAction.bind(null, friendGroup.id, member.id)}
                      confirmation={{
                        title: "Remover participante?",
                        description: `${member.name} será removido do Grupo de Amigos e o convite atual será desativado.`,
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
                action={deleteFriendGroupAction.bind(null, friendGroup.id)}
                confirmation={{
                  title: "Excluir Grupo de Amigos?",
                  description: `O Grupo de Amigos "${friendGroup.name}" será excluído permanentemente. Esta ação não pode ser desfeita.`,
                  confirmLabel: "Excluir Grupo de Amigos",
                  intent: "danger",
                }}
                className="pt-3"
              >
                <Button type="submit" variant="destructive">Excluir Grupo de Amigos</Button>
              </ConfirmationForm>
            </CardContent>
          </Card>
        </section>
      ) : null}
      {friendGroup.isMember && !friendGroup.isOwner ? (
        <Card className="max-w-md">
          <CardHeader><CardTitle>Participação</CardTitle></CardHeader>
          <CardContent>
            <ConfirmationForm
              action={leaveFriendGroupAction.bind(null, friendGroup.id)}
              confirmation={{
                title: "Sair do Grupo de Amigos?",
                description: `Você sairá do Grupo de Amigos "${friendGroup.name}" e precisará de um novo convite para voltar.`,
                confirmLabel: "Sair do Grupo de Amigos",
                intent: "danger",
              }}
            >
              <Button type="submit" variant="destructive">Sair do Grupo de Amigos</Button>
            </ConfirmationForm>
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}
