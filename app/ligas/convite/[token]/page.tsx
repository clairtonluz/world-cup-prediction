import Link from "next/link";
import { signIn, auth } from "@/auth";
import { joinLeagueAction } from "@/actions/league-actions";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isUser } from "@/lib/authorization";
import { getInvitePreview } from "@/lib/data/leagues";
import { inviteTokenSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function LeagueInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ token }, messages, session] = await Promise.all([params, searchParams, auth()]);
  const parsedToken = inviteTokenSchema.safeParse(token);

  if (!parsedToken.success) {
    return <InvalidInvite />;
  }

  if (!session?.user || session.error || !isUser(session.user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Convite para liga</CardTitle>
            <p className="text-sm text-slate-600">
              Entre para visualizar e aceitar este convite privado.
            </p>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                "use server";
                await signIn("keycloak", {
                  redirectTo: `/ligas/convite/${parsedToken.data}`,
                });
              }}
            >
              <Button className="w-full" type="submit">Entrar com Keycloak</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  const league = await getInvitePreview(parsedToken.data);
  if (!league) {
    return (
      <AppShell>
        <MessageAlert {...messages} />
        <InvalidInviteCard />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MessageAlert {...messages} />
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Convite para {league.name}</CardTitle>
          <p className="text-sm text-slate-600">
            Liga privada criada por {league.ownerName}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {league.isMember ? (
            <>
              <p className="text-sm text-slate-600">Você já participa desta liga.</p>
              <Link href={`/ligas/${league.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
                Abrir ranking da liga
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Ao aceitar, seu total de pontos no torneio entrará no ranking desta liga.
              </p>
              <form action={joinLeagueAction.bind(null, parsedToken.data)}>
                <Button type="submit">Entrar na liga</Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function InvalidInvite() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <InvalidInviteCard />
    </main>
  );
}

function InvalidInviteCard() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader><CardTitle>Convite indisponível</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>Este convite não existe mais ou foi desativado.</p>
        <Link href="/ligas" className="font-medium text-emerald-700 hover:underline">
          Voltar para ligas
        </Link>
      </CardContent>
    </Card>
  );
}
