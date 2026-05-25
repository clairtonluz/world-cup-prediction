import { cn } from "@/lib/utils";
import type { RankingRow } from "@/lib/data/ranking";

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-600">No participants are ranked yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-slate-500">
          <tr>
            <th className="p-3 font-medium">Position</th>
            <th className="p-3 font-medium">Player</th>
            <th className="p-3 text-right font-medium">Points</th>
            <th className="p-3 text-right font-medium">Exact</th>
            <th className="p-3 text-right font-medium">Winners</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "border-b border-slate-100",
                row.isCurrentUser && "bg-emerald-50 font-medium",
              )}
            >
              <td className="p-3">#{row.position}</td>
              <td className="p-3">
                {row.name}
                {row.isCurrentUser ? " (you)" : ""}
              </td>
              <td className="p-3 text-right">{row.totalPoints}</td>
              <td className="p-3 text-right">{row.exactPredictions}</td>
              <td className="p-3 text-right">{row.correctWinners}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
