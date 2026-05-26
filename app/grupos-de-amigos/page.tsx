import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { FriendGroupCreationForm } from "@/components/friend-groups/friend-group-creation-form";
import { FriendGroupList } from "@/components/friend-groups/friend-group-list";
import { MessageAlert } from "@/components/shared/message-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin } from "@/lib/authorization";
import { requireUser } from "@/lib/auth-guards";
import { listAdminFriendGroups, listMyFriendGroups } from "@/lib/data/friend-groups";

export const dynamic = "force-dynamic";

export default async function FriendGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { session } = await requireUser();
  const canAdministerFriendGroups = isAdmin(session.user);
  const [messages, friendGroups, adminFriendGroups] = await Promise.all([
    searchParams,
    listMyFriendGroups(),
    canAdministerFriendGroups ? listAdminFriendGroups() : Promise.resolve(null),
  ]);

  return (
    <AppShell>
      <MessageAlert {...messages} />
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Grupos de Amigos</h1>
        <p className="mt-1 text-slate-600">
          Crie um Grupo de Amigos privado, convide amigos e acompanhe o ranking entre membros.
        </p>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader><CardTitle>Criar Grupo de Amigos</CardTitle></CardHeader>
          <CardContent><FriendGroupCreationForm /></CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Meus Grupos de Amigos</CardTitle></CardHeader>
            <CardContent>
              <FriendGroupList
                friendGroups={friendGroups}
                emptyMessage="Você ainda não participa de um Grupo de Amigos. Seu ranking global continua disponível."
              />
            </CardContent>
          </Card>
          {adminFriendGroups ? (
            <Card>
              <CardHeader><CardTitle>Grupos de Amigos administrados</CardTitle></CardHeader>
              <CardContent>
                <FriendGroupList
                  friendGroups={adminFriendGroups}
                  emptyMessage="Não há outros Grupos de Amigos para administrar."
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
