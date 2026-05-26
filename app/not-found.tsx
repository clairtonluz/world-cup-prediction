import Link from "next/link";
import { TournamentAccentBars, TournamentPublicPage } from "@/components/shared/tournament-theme";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NotFound() {
  return (
    <TournamentPublicPage>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <TournamentAccentBars className="mb-5" />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Jogo não encontrado
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">O jogo solicitado não existe.</p>
          <Link href="/matches" className="font-medium text-[#0756ac] hover:underline">
            Voltar para jogos
          </Link>
        </CardContent>
      </Card>
    </TournamentPublicPage>
  );
}
