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
          <CardTitle className="text-2xl">World Cup Predictor</CardTitle>
          <p className="text-sm text-slate-600">
            Predict matches, earn points, and compete with friends.
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
              Sign in with Keycloak
            </Button>
          </form>
          <p className="text-center text-xs text-slate-500">
            Participants must have a USER or ADMIN realm role.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
