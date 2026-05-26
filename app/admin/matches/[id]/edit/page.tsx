import Link from "next/link";
import { updateMatchAction } from "@/actions/admin-match-actions";
import { MatchForm } from "@/components/admin/match-form";
import { AppShell } from "@/components/shared/app-shell";
import { MatchTeams } from "@/components/shared/match-teams";
import { MessageAlert } from "@/components/shared/message-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminMatch } from "@/lib/data/matches";

export const dynamic = "force-dynamic";

export default async function EditMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const match = await getAdminMatch(id);
  const action = updateMatchAction.bind(null, match.id);
  return (
    <AppShell>
      <Link href="/admin/matches" className="text-sm font-medium text-emerald-700 hover:underline">Voltar para administração</Link>
      <MessageAlert {...messages} />
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>Atualizar</span>
            <MatchTeams
              teamA={match.teamA}
              teamB={match.teamB}
              teamASlot={match.teamASlot}
              teamBSlot={match.teamBSlot}
            />
          </CardTitle>
          <p className="text-sm text-slate-600">
            Todo placar salvo recalcula pontos e participantes de jogos futuros automaticamente.
          </p>
        </CardHeader>
        <CardContent>
          <MatchForm action={action} match={match} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
