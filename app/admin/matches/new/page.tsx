import Link from "next/link";
import { createMatchAction } from "@/actions/admin-match-actions";
import { MatchForm } from "@/components/admin/match-form";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const messages = await searchParams;
  return (
    <AppShell>
      <Link href="/admin/matches" className="text-sm font-medium text-emerald-700 hover:underline">Back to matches</Link>
      <MessageAlert {...messages} />
      <Card>
        <CardHeader><CardTitle>Create match</CardTitle></CardHeader>
        <CardContent><MatchForm action={createMatchAction} /></CardContent>
      </Card>
    </AppShell>
  );
}
