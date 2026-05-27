export function PredictionsTable({
  predictions,
  provisional = false,
}: {
  predictions: {
    id: string;
    teamAScore: number;
    teamBScore: number;
    predictedAdvancingTeam: string | null;
    points: number;
    user: { id: string; name: string; image: string | null };
  }[] | null;
  provisional?: boolean;
}) {
  if (predictions === null) {
    return (
      <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
        As apostas dos outros participantes ficam ocultas até o início do jogo.
      </p>
    );
  }

  if (predictions.length === 0) {
    return <p className="text-sm text-slate-600">Nenhuma aposta foi enviada.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-slate-500">
          <tr>
            <th className="py-3 font-medium">Participante</th>
            <th className="py-3 font-medium">Aposta</th>
            <th className="py-3 text-right font-medium">
              {provisional ? "Pontos provisórios" : "Pontos"}
            </th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((prediction) => (
            <tr key={prediction.id} className="border-b border-slate-100">
              <td className="py-3 font-medium text-slate-900">{prediction.user.name}</td>
              <td className="py-3">
                <p>{prediction.teamAScore} x {prediction.teamBScore}</p>
                {prediction.predictedAdvancingTeam ? (
                  <p className="text-xs text-slate-600">
                    Classificada: {prediction.predictedAdvancingTeam}
                  </p>
                ) : null}
              </td>
              <td className="py-3 text-right">{prediction.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
