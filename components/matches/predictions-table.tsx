export function PredictionsTable({
  predictions,
}: {
  predictions: {
    id: string;
    teamAScore: number;
    teamBScore: number;
    points: number;
    user: { id: string; name: string; image: string | null };
  }[] | null;
}) {
  if (predictions === null) {
    return (
      <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
        Predictions from other participants are hidden until the match starts.
      </p>
    );
  }

  if (predictions.length === 0) {
    return <p className="text-sm text-slate-600">No predictions were submitted.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-slate-500">
          <tr>
            <th className="py-3 font-medium">Player</th>
            <th className="py-3 font-medium">Prediction</th>
            <th className="py-3 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((prediction) => (
            <tr key={prediction.id} className="border-b border-slate-100">
              <td className="py-3 font-medium text-slate-900">{prediction.user.name}</td>
              <td className="py-3">{prediction.teamAScore} x {prediction.teamBScore}</td>
              <td className="py-3 text-right">{prediction.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
