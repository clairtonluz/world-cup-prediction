import Link from "next/link";
import { RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import {
  runMatchScoreSyncAction,
  setMatchScoreSyncLockedAction,
} from "@/actions/score-sync-actions";
import { updateMatchAction } from "@/actions/admin-match-actions";
import { MatchForm } from "@/components/admin/match-form";
import { ConfirmationForm } from "@/components/shared/confirmation-form";
import { AppShell } from "@/components/shared/app-shell";
import { MatchTeams } from "@/components/shared/match-teams";
import { MessageAlert } from "@/components/shared/message-alert";
import { Button } from "@/components/ui/button";
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
  const syncByProviderAction = runMatchScoreSyncAction.bind(null, match.id);
  const lockSyncAction = setMatchScoreSyncLockedAction.bind(null, match.id);
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
      <Card>
        <CardHeader>
          <CardTitle>Sincronização de placar</CardTitle>
          <p className="text-sm text-slate-600">
            O bloqueio manual impede atualizações automáticas pelo ESPN Scoreboard apenas para este jogo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">ESPN event ID</dt>
              <dd className="font-medium text-slate-950">
                {match.espnEventId ?? "Não mapeado"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Atualização automática</dt>
              <dd className="font-medium text-slate-950">
                {match.scoreSyncLocked ? "Bloqueada para este jogo" : "Liberada para este jogo"}
              </dd>
            </div>
          </dl>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ConfirmationForm
              action={syncByProviderAction}
              confirmation={{
                title: "Atualizar este jogo pelo ESPN Scoreboard?",
                description: match.scoreSyncLocked
                  ? "Este jogo está bloqueado para sincronização automática. Confirmar esta ação faz uma atualização pontual sem ligar a atualização automática."
                  : "O ESPN Scoreboard será consultado para atualizar somente este jogo.",
                confirmLabel: "Atualizar placar",
              }}
            >
              <input
                type="hidden"
                name="overrideLock"
                value={match.scoreSyncLocked ? "true" : "false"}
              />
              <Button type="submit" className="w-full gap-2 sm:w-auto">
                <RefreshCw className="size-4" aria-hidden="true" />
                Atualizar placar
              </Button>
            </ConfirmationForm>
            <ConfirmationForm
              action={lockSyncAction}
              confirmation={{
                title: match.scoreSyncLocked
                  ? "Liberar atualizações automáticas?"
                  : "Bloquear atualizações automáticas?",
                description: match.scoreSyncLocked
                  ? "Este jogo voltará a receber atualizações automáticas quando estiver dentro da janela de sincronização."
                  : "As atualizações automáticas serão ignoradas para este jogo até que o bloqueio seja removido.",
                confirmLabel: match.scoreSyncLocked ? "Liberar sync" : "Bloquear sync",
              }}
            >
              <input
                type="hidden"
                name="scoreSyncLocked"
                value={match.scoreSyncLocked ? "false" : "true"}
              />
              <Button type="submit" variant="outline" className="w-full gap-2 sm:w-auto">
                {match.scoreSyncLocked ? (
                  <ShieldCheck className="size-4" aria-hidden="true" />
                ) : (
                  <ShieldOff className="size-4" aria-hidden="true" />
                )}
                {match.scoreSyncLocked ? "Liberar sync" : "Bloquear sync"}
              </Button>
            </ConfirmationForm>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
