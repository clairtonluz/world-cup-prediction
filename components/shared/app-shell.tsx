import { requireUser } from "@/lib/auth-guards";
import { AppHeader } from "@/components/shared/app-header";
import { TournamentAccentBars, TournamentBackdrop } from "@/components/shared/tournament-theme";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { session, user } = await requireUser();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080b12]">
      <TournamentBackdrop />
      <AppHeader name={user.name} roles={session.user.roles} />
      <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-50/95 px-4 py-6 shadow-2xl shadow-black/25 sm:p-8">
          <TournamentAccentBars />
          {children}
        </div>
      </main>
    </div>
  );
}
