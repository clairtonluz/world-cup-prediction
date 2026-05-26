import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function TournamentBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(14,116,225,0.28),transparent_34%),radial-gradient(circle_at_20%_82%,rgba(9,157,87,0.26),transparent_31%),radial-gradient(circle_at_87%_12%,rgba(229,44,63,0.18),transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:44px_44px]"
      />
    </>
  );
}

export function TournamentAccentBars({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex gap-1.5", className)}>
      <span className="h-1 w-12 rounded-full bg-[#e52c3f]" />
      <span className="h-1 w-12 rounded-full bg-[#0e74e1]" />
      <span className="h-1 w-12 rounded-full bg-[#099d57]" />
    </div>
  );
}

export function TournamentBrand({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-3 text-white", className)}>
      <span className="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-white text-[#080b12]">
        <Trophy className="size-3.5" aria-hidden="true" />
        <span className="text-sm font-black leading-none">26</span>
      </span>
      <span>
        <span className="block text-sm font-bold uppercase tracking-wide">Bolão da Copa</span>
        <span className="block text-[0.65rem] font-medium uppercase tracking-[0.24em] text-slate-400">
          Mundial 2026
        </span>
      </span>
    </span>
  );
}

export function TournamentPublicPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-4 py-6">
      <TournamentBackdrop />
      <div className="relative w-full">{children}</div>
    </main>
  );
}
