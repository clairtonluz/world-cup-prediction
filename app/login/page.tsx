import { Trophy } from "lucide-react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageAlert } from "@/components/shared/message-alert";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Trophy className="mb-2 size-11 text-emerald-700" />
          <CardTitle className="text-2xl">Bolão da Copa do Mundo</CardTitle>
          <p className="text-sm text-slate-600">
            Aposte nos placares, faça pontos e dispute com seus amigos.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <MessageAlert error={error} />
          <form
            action={async () => {
              "use server";
              await signIn("keycloak", { redirectTo: "/matches" });
            }}
          >
            <Button className="w-full" type="submit">
              Entrar com Keycloak
            </Button>
          </form>
          <p className="text-center text-xs text-slate-500">
            Participantes precisam ter o papel USER ou ADMIN no Keycloak.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
