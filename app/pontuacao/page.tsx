import { AppShell } from "@/components/shared/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MATCH_STAGES, STAGE_LABELS } from "@/lib/constants";
import {
  pointsForDrawAdvancingTeamBonus,
  pointsForScoringCategory,
  type ScoringCategory,
} from "@/lib/scoring";
import { CHAMPION_BONUS_POINTS } from "@/lib/tournament-predictions";

export const dynamic = "force-dynamic";

const scoringRules: Array<{
  category: ScoringCategory;
  label: string;
  percentage: string;
  description: string;
}> = [
  {
    category: "EXACT_SCORE",
    label: "Placar exato",
    percentage: "100%",
    description: "Você acerta os gols marcados pelas duas equipes.",
  },
  {
    category: "CORRECT_WINNER_EXACT_WINNER_SCORE",
    label: "Vencedor e gols do vencedor",
    percentage: "70%",
    description: "Você acerta quem venceu e quantos gols o vencedor marcou.",
  },
  {
    category: "CORRECT_WINNER_EXACT_LOSER_SCORE",
    label: "Vencedor e gols do perdedor",
    percentage: "50%",
    description: "Você acerta quem venceu e quantos gols o perdedor marcou.",
  },
  {
    category: "CORRECT_RESULT_EXACT_GOAL_DIFFERENCE",
    label: "Resultado e diferença de gols",
    percentage: "40%",
    description:
      "Você acerta o resultado e a diferença de gols, incluindo empates.",
  },
  {
    category: "CORRECT_WINNER_ONLY",
    label: "Somente o vencedor",
    percentage: "30%",
    description: "Você acerta a equipe vencedora, mas não acerta os placares.",
  },
  {
    category: "WRONG_PREDICTION",
    label: "Resultado incorreto",
    percentage: "0%",
    description: "Você não acerta vitória, derrota ou empate.",
  },
];

export default function ScoringPage() {
  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">
          Como funciona a pontuação
        </h1>
        <p className="mt-1 max-w-3xl text-slate-600">
          Cada jogo tem uma pontuação máxima conforme a fase da Copa. Sua
          aposta recebe uma única pontuação, de acordo com o acerto mais
          preciso alcançado. O placar considerado é o dos 90 minutos mais
          acréscimos.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Regras de acerto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scoringRules.map((rule) => (
                <div
                  key={rule.category}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-slate-950">{rule.label}</p>
                    <p className="text-sm text-slate-600">{rule.description}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                    {rule.percentage}
                  </span>
                </div>
              ))}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-950">
                    Bônus de empate no mata-mata
                  </p>
                  <p className="text-sm text-slate-600">
                    Da segunda fase até a semifinal, se o placar previsto e o
                    oficial forem empate, acertar a equipe que avança soma 10%
                    dos pontos da fase. Na segunda fase, isso vale{" "}
                    {pointsForDrawAdvancingTeamBonus("ROUND_OF_32")} pontos.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                  +10%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exemplo rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              Em um jogo da <strong>fase de grupos</strong>, valendo até{" "}
              <strong>10 pontos</strong>, se o resultado oficial for{" "}
              <strong>2 x 1</strong>:
            </p>
            <p><strong>2 x 1</strong> vale 10 pontos: placar exato.</p>
            <p><strong>2 x 0</strong> vale 7 pontos: vencedor e gols do vencedor.</p>
            <p><strong>3 x 1</strong> vale 5 pontos: vencedor e gols do perdedor.</p>
            <p><strong>4 x 3</strong> vale 4 pontos: vencedor e diferença de gols.</p>
            <p><strong>3 x 0</strong> vale 3 pontos: somente o vencedor.</p>
            <p><strong>1 x 1</strong> vale 0 pontos: resultado incorreto.</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pontos por fase</CardTitle>
          <p className="text-sm text-slate-600">
            Pontuações percentuais são arredondadas para o número inteiro mais
            próximo.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th scope="col" className="py-3 pr-4 text-left">Fase</th>
                  {scoringRules.map((rule) => (
                    <th
                      key={rule.category}
                      scope="col"
                      className="px-3 py-3 text-right font-medium"
                    >
                      {rule.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATCH_STAGES.map((stage) => (
                  <tr key={stage} className="border-b border-slate-100 last:border-0">
                    <th scope="row" className="py-3 pr-4 text-left font-medium text-slate-950">
                      {STAGE_LABELS[stage]}
                    </th>
                    {scoringRules.map((rule) => (
                      <td key={rule.category} className="px-3 py-3 text-right">
                        {pointsForScoringCategory(stage, rule.category)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campeão da Copa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              Durante a fase de grupos, cada participante pode indicar ou
              alterar uma seleção campeã entre as equipes do torneio, até o
              início do mata-mata.
            </p>
            <p>
              Se o palpite coincidir com o campeão oficial após a final, ele
              soma <strong>{CHAMPION_BONUS_POINTS} pontos</strong>.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Desempate</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Maior total de pontos, incluindo o bônus do campeão.</li>
              <li>Maior número de placares exatos.</li>
              <li>Maior número de resultados corretos, incluindo empates.</li>
              <li>Maior número de classificados acertados no mata-mata.</li>
              <li>Acerto do campeão da Copa.</li>
            </ol>
            <p className="mt-3">
              Persistindo o empate, os participantes ocupam a mesma posição.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Placar e pênaltis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>
            O placar da aposta vale para o tempo regulamentar: 90 minutos mais
            acréscimos, quando houver.
          </p>
          <p>
            Disputas de pênaltis não entram na contagem do placar. No
            mata-mata, quando esse placar terminar empatado, a equipe que
            avança é registrada separadamente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pontos provisórios</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          Quando um jogo ao vivo já tem placar informado, os pontos podem
          aparecer no ranking e nas estatísticas como provisórios. Eles são
          recalculados quando o placar muda e confirmados ao fim da partida.
        </CardContent>
      </Card>
    </AppShell>
  );
}
