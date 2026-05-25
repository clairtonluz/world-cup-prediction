import { requireUser } from "@/lib/auth-guards";
import { AppHeader } from "@/components/shared/app-header";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { session, user } = await requireUser();
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader name={user.name} roles={session.user.roles} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
