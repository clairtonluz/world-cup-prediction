import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { recalculateAllPointsAction } from "@/actions/admin-match-actions";
import { AppShell } from "@/components/shared/app-shell";
import { MatchTeams } from "@/components/shared/match-teams";
import { ConfirmationForm } from "@/components/shared/confirmation-form";
import { MessageAlert } from "@/components/shared/message-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { listAdminMatches } from "@/lib/data/matches";
import { formatMatchDate, formatStage, formatStatus, scoreText } from "@/lib/display";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [messages, matches] = await Promise.all([searchParams, listAdminMatches()]);
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
          <CardTitle>Manutenção da pontuação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Recalcule os pontos de todas as apostas usando os placares atuais.
            Jogos sem placar terão suas apostas zeradas.
          </p>
          <ConfirmationForm
            action={recalculateAllPointsAction}
            confirmation={{
              title: "Recalcular todos os pontos?",
              description:
                "Todas as apostas serão recalculadas com os placares atuais. Jogos sem placar ficarão com 0 pontos.",
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
                      <td>{scoreText(match.teamAScore, match.teamBScore)}</td>
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
