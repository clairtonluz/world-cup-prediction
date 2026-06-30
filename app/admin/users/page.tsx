import { toggleUserRankingVisibility } from "@/actions/admin-user-actions";
import { AppShell } from "@/components/shared/app-shell";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { MessageAlert } from "@/components/shared/message-alert";
import { PlayerScoreLink } from "@/components/shared/player-score-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/display";
import { getAdminUsersPageData } from "@/lib/data/users";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const { users, totalUsers } = await getAdminUsersPageData(query);

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Administração</h1>
          <p className="mt-1 text-slate-600">
            Gerencie jogos, usuários e o funcionamento do bolão.
          </p>
        </div>
      </div>

      <MessageAlert {...params} />
      <AdminTabs />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pesquisar usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input
              name="q"
              placeholder="Nome ou e-mail..."
              defaultValue={query}
              className="max-w-md"
            />
            <Button type="submit">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Usuários</CardTitle>
            <p className="text-sm font-medium text-slate-600">
              Total de usuários:{" "}
              <span className="text-slate-950">{totalUsers}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum usuário encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-3">Nome</th>
                    <th>E-mail</th>
                    <th>Cadastro</th>
                    <th>Visibilidade no Ranking</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100">
                      <td className="py-4">
                        <PlayerScoreLink
                          playerId={user.id}
                          name={user.name}
                          className="text-slate-950"
                        />
                      </td>
                      <td>{user.email}</td>
                      <td className="text-slate-600">{formatDateTime(user.createdAt)}</td>
                      <td>
                        {user.hiddenFromGlobalRanking ? (
                          <span className="text-red-600 font-medium">Oculto</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Visível</span>
                        )}
                      </td>
                      <td className="text-right">
                        <form
                          action={async () => {
                            "use server";
                            await toggleUserRankingVisibility(
                              user.id,
                              !user.hiddenFromGlobalRanking
                            );
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className={
                              user.hiddenFromGlobalRanking
                                ? "text-emerald-700 hover:text-emerald-800"
                                : "text-red-700 hover:text-red-800"
                            }
                          >
                            {user.hiddenFromGlobalRanking ? "Mostrar" : "Ocultar"}
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
