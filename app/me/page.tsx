import { updateFavoriteTeamAction } from "@/actions/profile-actions";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { StatCard } from "@/components/stats/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { getPersonalStatistics } from "@/lib/data/statistics";

export const dynamic = "force-dynamic";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [messages, stats] = await Promise.all([searchParams, getPersonalStatistics()]);
  return (
    <AppShell>
      <h1 className="text-3xl font-semibold text-slate-950">My statistics</h1>
      <MessageAlert {...messages} />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Points" value={stats.totalPoints} />
        <StatCard label="Exact Predictions" value={stats.exactPredictions} />
        <StatCard label="Correct Winners" value={stats.correctWinners} />
        <StatCard label="Matches Predicted" value={stats.totalPredictions} />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Accuracy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">{stats.accuracy}%</p>
            <Progress value={stats.accuracy} />
            <p className="text-sm text-slate-600">Based on {stats.scoredPredictions} scored predictions.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Highlights</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Favorite team: <strong>{stats.favoriteTeam ?? "Not selected"}</strong></p>
            <p>Best stage: <strong>{stats.bestStage ? `${stats.bestStage.label} (${stats.bestStage.points} pts)` : "No scored predictions yet"}</strong></p>
          </CardContent>
        </Card>
      </section>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Favorite team</CardTitle></CardHeader>
        <CardContent>
          <form action={updateFavoriteTeamAction} className="space-y-4">
            <div>
              <Label htmlFor="favoriteTeam">Team name</Label>
              <Input id="favoriteTeam" name="favoriteTeam" defaultValue={stats.favoriteTeam ?? ""} placeholder="Brazil" maxLength={80} />
            </div>
            <Button type="submit">Save preference</Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
