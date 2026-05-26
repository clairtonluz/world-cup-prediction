import { cn } from "@/lib/utils";
import type { RankingRow } from "@/lib/data/ranking";
import Image from "next/image";

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-600">Nenhum participante no ranking.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-slate-500">
          <tr>
            <th className="p-3 font-medium">Posição</th>
            <th className="p-3 font-medium">Participante</th>
            <th className="p-3 text-right font-medium">Pontos</th>
            <th className="p-3 text-right font-medium">Exatos</th>
            <th className="p-3 text-right font-medium">Vencedores</th>
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
              <td className="flex items-center gap-2 p-3">
                {row.image ? (
                  <Image
                    src={row.image}
                    alt=""
                    width={28}
                    height={28}
                    unoptimized
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold">
                    {row.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                {row.name}
                {row.isCurrentUser ? " (você)" : ""}
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
