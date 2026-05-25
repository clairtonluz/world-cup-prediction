import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { listAdminMatches } from "@/lib/data/matches";
import { formatMatchDate, formatStage, formatStatus, scoreText } from "@/lib/display";

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
          <h1 className="text-3xl font-semibold">Manage matches</h1>
          <p className="mt-1 text-slate-600">Create fixtures and enter final results.</p>
        </div>
        <Link className={buttonVariants()} href="/admin/matches/new">New match</Link>
      </div>
      <MessageAlert {...messages} />
      <Card>
        <CardHeader><CardTitle>Fixtures</CardTitle></CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-sm text-slate-600">No matches created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr><th className="py-3">Match</th><th>Stage / kickoff</th><th>Status</th><th>Score</th><th></th></tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id} className="border-b border-slate-100">
                      <td className="py-4 font-medium">{match.teamA} x {match.teamB}</td>
                      <td>{formatStage(match.stage as MatchStageValue)}<br /><span className="text-slate-500">{formatMatchDate(match.startsAt)}</span></td>
                      <td><StatusBadge status={match.status as MatchStatusValue}>{formatStatus(match.status as MatchStatusValue)}</StatusBadge></td>
                      <td>{scoreText(match.teamAScore, match.teamBScore)}</td>
                      <td className="text-right"><Link className="text-emerald-700 hover:underline" href={`/admin/matches/${match.id}/edit`}>Edit</Link></td>
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
