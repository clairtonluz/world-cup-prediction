import Link from "next/link";
import { signIn, auth } from "@/auth";
import { joinFriendGroupAction } from "@/actions/friend-group-actions";
import { AppShell } from "@/components/shared/app-shell";
import { MessageAlert } from "@/components/shared/message-alert";
import { TournamentAccentBars, TournamentPublicPage } from "@/components/shared/tournament-theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isUser } from "@/lib/authorization";
import { getInvitePreview } from "@/lib/data/friend-groups";
import { inviteTokenSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function FriendGroupInvitePage({
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

  if (!session?.user || !isUser(session.user)) {
    return (
      <TournamentPublicPage>
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <TournamentAccentBars className="mb-5" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Convite para Grupo de Amigos
            </h1>
            <p className="text-sm text-slate-600">
              Entre para visualizar e aceitar este convite privado.
            </p>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                "use server";
                await signIn("keycloak", {
                  redirectTo: `/grupos-de-amigos/convite/${parsedToken.data}`,
                });
              }}
            >
              <Button className="w-full" type="submit">Entrar</Button>
            </form>
          </CardContent>
        </Card>
      </TournamentPublicPage>
    );
  }

  const friendGroup = await getInvitePreview(parsedToken.data);
  if (!friendGroup) {
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Convite para {friendGroup.name}
          </h1>
          <p className="text-sm text-slate-600">
            Grupo de Amigos privado criado por {friendGroup.ownerName}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {friendGroup.isMember ? (
            <>
              <p className="text-sm text-slate-600">Você já participa deste Grupo de Amigos.</p>
              <Link href={`/grupos-de-amigos/${friendGroup.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
                Abrir ranking do Grupo de Amigos
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Ao aceitar, seu total de pontos no torneio entrará no ranking deste Grupo de Amigos.
              </p>
              <form action={joinFriendGroupAction.bind(null, parsedToken.data)}>
                <Button type="submit">Entrar no Grupo de Amigos</Button>
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
    <TournamentPublicPage>
      <InvalidInviteCard />
    </TournamentPublicPage>
  );
}

function InvalidInviteCard() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <TournamentAccentBars className="mb-5" />
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Convite indisponível
        </h1>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>Este convite não existe mais ou foi desativado.</p>
        <Link href="/grupos-de-amigos" className="font-medium text-emerald-700 hover:underline">
          Voltar para Grupos de Amigos
        </Link>
      </CardContent>
    </Card>
  );
}
