import { cn } from "@/lib/utils";
import type { RankingRow } from "@/lib/ranking";
import { getPodiumRowClassName, RankingPosition } from "@/components/ranking/ranking-position";
import { PlayerScoreLink } from "@/components/shared/player-score-link";

const rankingMetrics = [
  {
    label: "Exatos",
    value: (row: RankingRow) => row.exactPredictions,
  },
  {
    label: "Resultados",
    value: (row: RankingRow) => row.correctResults,
  },
  {
    label: "Classificados",
    value: (row: RankingRow) => row.correctAdvancingTeams,
  },
];

export function RankingTable({
  rows,
  showPredictedChampion = false,
}: {
  rows: RankingRow[];
  showPredictedChampion?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-600">Nenhum participante no ranking.</p>;
  }

  return (
    <>
      <ol className="space-y-2 lg:hidden" aria-label="Ranking de participantes">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn(
              "rounded-xl px-2 py-3",
              getPodiumRowClassName(row.position),
              row.isCurrentUser && "bg-emerald-50 font-medium ring-1 ring-emerald-100",
            )}
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <RankingPosition position={row.position} className="shrink-0" />

              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 overflow-hidden">
                <PlayerScoreLink
                  playerId={row.id}
                  name={row.name}
                  className="line-clamp-2 min-w-0 flex-1 break-words font-medium leading-snug text-slate-950"
                />
                {row.isCurrentUser ? <CurrentUserBadge /> : null}
              </div>

              <div className="min-w-14 text-right">
                <strong className="block text-xl leading-none tabular-nums text-slate-950">
                  {row.totalPoints}
                </strong>
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  pts
                </span>
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              {rankingMetrics.map((metric) => (
                <div key={metric.label} className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="truncate text-xs font-normal text-slate-500">
                    {metric.label}
                  </dt>
                  <dd className="mt-1 tabular-nums text-slate-950">
                    {metric.value(row)}
                  </dd>
                </div>
              ))}
            </dl>

            {showPredictedChampion ? (
              <p className="mt-3 text-sm font-normal text-slate-600">
                <span>Campeão previsto: </span>
                <span className="font-medium text-slate-950">
                  {championPredictionLabel(row)}
                </span>
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Ranking de participantes</caption>
          <thead className="border-b text-slate-500">
            <tr>
              <th scope="col" className="p-3 font-medium">Posição</th>
              <th scope="col" className="p-3 font-medium">Participante</th>
              <th scope="col" className="p-3 text-right font-medium">Pontos</th>
              <th scope="col" className="p-3 text-right font-medium">Exatos</th>
              <th scope="col" className="p-3 text-right font-medium">Resultados</th>
              <th scope="col" className="p-3 text-right font-medium">Classificados</th>
              {showPredictedChampion ? (
                <th scope="col" className="p-3 font-medium">Campeão previsto</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const podiumClassName = getPodiumRowClassName(row.position);

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-slate-100",
                    podiumClassName,
                    row.isCurrentUser && "bg-emerald-50 font-medium",
                  )}
                >
                  <td className="p-3">
                    <RankingPosition position={row.position} />
                  </td>
                  <th
                    scope="row"
                    className={cn(
                      "p-3 text-left",
                      podiumClassName || row.isCurrentUser
                        ? "font-medium"
                        : "font-normal",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                      <PlayerScoreLink
                        playerId={row.id}
                        name={row.name}
                        className="min-w-0 flex-1 truncate text-slate-950"
                      />
                      {row.isCurrentUser ? <CurrentUserBadge /> : null}
                    </span>
                  </th>
                  <td className="p-3 text-right">{row.totalPoints}</td>
                  <td className="p-3 text-right">{row.exactPredictions}</td>
                  <td className="p-3 text-right">{row.correctResults}</td>
                  <td className="p-3 text-right">{row.correctAdvancingTeams}</td>
                  {showPredictedChampion ? (
                    <td className="p-3">{championPredictionLabel(row)}</td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CurrentUserBadge() {
  return (
    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
      Você
    </span>
  );
}

function championPredictionLabel(row: RankingRow) {
  const predictedChampion = row.predictedChampion ?? "-";

  if (!row.championPredictionCorrect) {
    return predictedChampion;
  }

  return `${predictedChampion} (+${row.championBonusPoints} pts)`;
}
