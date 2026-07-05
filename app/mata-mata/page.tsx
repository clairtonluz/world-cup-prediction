import { KnockoutBracketView } from "@/components/bracket/knockout-bracket-view";
import { AppShell } from "@/components/shared/app-shell";
import { listMatches } from "@/lib/data/matches";
import { buildKnockoutBracket } from "@/lib/knockout-bracket";

export const dynamic = "force-dynamic";

export default async function KnockoutPage() {
  const matches = await listMatches();
  const bracket = buildKnockoutBracket(matches);

  return (
    <AppShell width="wide">
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">
          Mata-mata
        </h1>
        <p className="mt-1 max-w-3xl text-slate-600">
          Visualize a chave oficial da Copa, os participantes confirmados ou
          projetados e seus palpites em cada confronto.
        </p>
      </section>

      <KnockoutBracketView bracket={bracket} />
    </AppShell>
  );
}
