import Link from "next/link";
import { updateMatchAction } from "@/actions/admin-match-actions";
import { MatchForm } from "@/components/admin/match-form";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminMatch } from "@/lib/data/matches";
import { hasEffectivelyStarted } from "@/lib/match-rules";

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
      <Link href="/admin/matches" className="text-sm font-medium text-emerald-700 hover:underline">Back to matches</Link>
      <MessageAlert {...messages} />
      <Card>
        <CardHeader>
          <CardTitle>Edit {match.teamA} x {match.teamB}</CardTitle>
          <p className="text-sm text-slate-600">Changing a finished score automatically recalculates every prediction.</p>
        </CardHeader>
        <CardContent>
          <MatchForm
            action={action}
            match={match}
            fixtureLocked={hasEffectivelyStarted(match)}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
