import Link from "next/link";

export type LeagueListItem = {
  id: string;
  name: string;
  ownerName: string;
  memberCount: number;
  isOwner: boolean;
};

export function LeagueList({
  leagues,
  emptyMessage,
}: {
  leagues: LeagueListItem[];
  emptyMessage: string;
}) {
  return (
    <div className="space-y-3">
      {leagues.map((league) => (
        <Link
          key={league.id}
          href={`/ligas/${league.id}`}
          className="block rounded-lg border border-slate-200 p-4 hover:border-emerald-300 hover:bg-emerald-50"
        >
          <div className="flex items-center justify-between gap-4">
            <strong className="text-slate-950">{league.name}</strong>
            <span className="text-sm text-slate-600">
              {league.memberCount} {league.memberCount === 1 ? "membro" : "membros"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Criada por {league.ownerName}{league.isOwner ? " (você)" : ""}
          </p>
        </Link>
      ))}
      {leagues.length === 0 ? (
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      ) : null}
    </div>
  );
}
