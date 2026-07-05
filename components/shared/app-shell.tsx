import { requireUser } from "@/lib/auth-guards";
import { AppHeader } from "@/components/shared/app-header";
import { TournamentAccentBars, TournamentBackdrop } from "@/components/shared/tournament-theme";
import { cn } from "@/lib/utils";

export async function AppShell({
  children,
  width = "default",
}: {
  children: React.ReactNode;
  width?: "default" | "wide";
}) {
  const { session, user } = await requireUser();
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#080b12]">
      <TournamentBackdrop />
      <AppHeader name={user.name} roles={session.user.roles} />
      <main
        className={cn(
          "relative mx-auto px-4 py-6 sm:px-6 sm:py-8",
          width === "wide" ? "max-w-[96rem]" : "max-w-6xl",
        )}
      >
        <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-50/95 px-4 py-6 shadow-2xl shadow-black/25 sm:p-8">
          <TournamentAccentBars />
          {children}
        </div>
      </main>
    </div>
  );
}
