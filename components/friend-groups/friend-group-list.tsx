import Link from "next/link";
import { PlayerScoreLink } from "@/components/shared/player-score-link";

export type FriendGroupListItem = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  isOwner: boolean;
};

export function FriendGroupList({
  friendGroups,
  emptyMessage,
}: {
  friendGroups: FriendGroupListItem[];
  emptyMessage: string;
}) {
  return (
    <div className="space-y-3">
      {friendGroups.map((friendGroup) => (
        <div
          key={friendGroup.id}
          className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
        >
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/grupos-de-amigos/${friendGroup.id}`}
              className="font-semibold text-slate-950 hover:text-emerald-700 hover:underline"
            >
              {friendGroup.name}
            </Link>
            <span className="text-sm text-slate-600">
              {friendGroup.memberCount} {friendGroup.memberCount === 1 ? "membro" : "membros"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Criado por{" "}
            <PlayerScoreLink
              playerId={friendGroup.ownerId}
              name={friendGroup.ownerName}
              className="text-slate-700"
            />
            {friendGroup.isOwner ? " (você)" : ""}
          </p>
        </div>
      ))}
      {friendGroups.length === 0 ? (
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      ) : null}
    </div>
  );
}
