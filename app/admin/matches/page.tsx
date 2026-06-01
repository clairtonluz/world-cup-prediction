import Link from "next/link";
import { Download, RefreshCw, Save } from "lucide-react";
import {
  importEspnEventsAction,
  runScoreSyncAction,
  updateScoreSyncSettingsAction,
} from "@/actions/score-sync-actions";
import { recalculateAllPointsAction } from "@/actions/admin-match-actions";
import { AppShell } from "@/components/shared/app-shell";
import { MatchTeams } from "@/components/shared/match-teams";
import { MatchScoreboard } from "@/components/shared/match-scoreboard";
import { ConfirmationForm } from "@/components/shared/confirmation-form";
import { MessageAlert } from "@/components/shared/message-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { getScoreSyncSettings } from "@/lib/score-sync/sync";
import { listAdminMatches } from "@/lib/data/matches";
import { formatMatchDate, formatStage, formatStatus } from "@/lib/display";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [messages, matches] = await Promise.all([
    searchParams,
    listAdminMatches(),
  ]);
  const scoreSyncSettings = await getScoreSyncSettings();
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
      <MessageAlert {...messages} />
      <AdminTabs />
      <Card>
        <CardHeader>
          <CardTitle>Sincronização de placares</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            action={updateScoreSyncSettingsAction}
            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto]"
          >
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={scoreSyncSettings.enabled}
                className="size-4 rounded border-slate-300"
              />
              Atualização automática ativa
            </label>
            <label className="text-sm font-medium text-slate-700">
              Intervalo em minutos
              <input
                type="number"
                name="intervalMinutes"
                min={1}
                max={180}
                defaultValue={scoreSyncSettings.intervalMinutes}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#0e74e1] focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <Button type="submit" className="gap-2 self-end">
              <Save className="size-4" aria-hidden="true" />
              Salvar
            </Button>
          </form>
          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <p>Última tentativa: {scoreSyncSettings.lastSyncFinishedAt ? formatMatchDate(scoreSyncSettings.lastSyncFinishedAt) : "nunca"}</p>
            <p>Último sucesso: {scoreSyncSettings.lastSuccessfulSyncAt ? formatMatchDate(scoreSyncSettings.lastSuccessfulSyncAt) : "nunca"}</p>
            <p>Fonte: ESPN Scoreboard</p>
          </div>
          {scoreSyncSettings.lastSyncSummary || scoreSyncSettings.lastSyncError ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {scoreSyncSettings.lastSyncError ?? scoreSyncSettings.lastSyncSummary}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <ConfirmationForm
              action={importEspnEventsAction}
              confirmation={{
                title: "Importar eventos da ESPN?",
                description:
                  "O ESPN Scoreboard será consultado para mapear os event IDs aos jogos existentes. Resultados e palpites não serão alterados.",
                confirmLabel: "Importar eventos",
              }}
            >
              <Button type="submit" variant="outline" className="w-full gap-2 sm:w-auto">
                <Download className="size-4" aria-hidden="true" />
                Importar eventos
              </Button>
            </ConfirmationForm>
            <ConfirmationForm
              action={runScoreSyncAction}
              confirmation={{
                title: "Sincronizar jogos agora?",
                description:
                  "O ESPN Scoreboard será consultado somente para jogos já iniciados e dentro da janela de atualização.",
                confirmLabel: "Sincronizar agora",
              }}
            >
              <Button type="submit" variant="outline" className="w-full gap-2 sm:w-auto">
                <RefreshCw className="size-4" aria-hidden="true" />
                Sincronizar agora
              </Button>
            </ConfirmationForm>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manutenção da pontuação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Recalcule os pontos de todas as apostas usando os placares atuais.
            Nenhum palpite será apagado; jogos ainda sem resultado continuarão
            com 0 pontos.
          </p>
          <ConfirmationForm
            action={recalculateAllPointsAction}
            confirmation={{
              title: "Recalcular todos os pontos?",
              description:
                "Todas as apostas serão recalculadas com os placares atuais. Nenhum palpite será apagado; jogos ainda sem resultado continuarão com 0 pontos.",
              confirmLabel: "Recalcular pontos",
            }}
          >
            <Button type="submit" className="w-full gap-2 sm:w-auto">
              <RefreshCw className="size-4" aria-hidden="true" />
              Recalcular pontos
            </Button>
          </ConfirmationForm>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Agenda oficial</CardTitle></CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum jogo cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr><th className="py-3">Jogo</th><th>Fase / horário</th><th>Status</th><th>Placar</th><th></th></tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id} className="border-b border-slate-100">
                      <td className="py-4 font-medium">
                        <span className="mr-2 text-slate-500">#{match.matchNumber}</span>
                        <MatchTeams
                          teamA={match.teamA}
                          teamB={match.teamB}
                          teamASlot={match.teamASlot}
                          teamBSlot={match.teamBSlot}
                        />
                      </td>
                      <td>{formatStage(match.stage as MatchStageValue)}<br /><span className="text-slate-500">{formatMatchDate(match.startsAt)}</span></td>
                      <td><StatusBadge status={match.status as MatchStatusValue}>{formatStatus(match.status as MatchStatusValue)}</StatusBadge></td>
                      <td className="min-w-64">
                        <MatchScoreboard
                          teamA={match.teamA}
                          teamB={match.teamB}
                          teamASlot={match.teamASlot}
                          teamBSlot={match.teamBSlot}
                          teamAScore={match.teamAScore}
                          teamBScore={match.teamBScore}
                          size="compact"
                        />
                      </td>
                      <td className="text-right"><Link className="text-emerald-700 hover:underline" href={`/admin/matches/${match.id}/edit`}>Atualizar</Link></td>
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
