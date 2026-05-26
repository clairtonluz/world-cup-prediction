import Link from "next/link";

export type FriendGroupListItem = {
  id: string;
  name: string;
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
        <Link
          key={friendGroup.id}
          href={`/grupos-de-amigos/${friendGroup.id}`}
          className="block rounded-lg border border-slate-200 p-4 hover:border-emerald-300 hover:bg-emerald-50"
        >
          <div className="flex items-center justify-between gap-4">
            <strong className="text-slate-950">{friendGroup.name}</strong>
            <span className="text-sm text-slate-600">
              {friendGroup.memberCount} {friendGroup.memberCount === 1 ? "membro" : "membros"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Criado por {friendGroup.ownerName}{friendGroup.isOwner ? " (você)" : ""}
          </p>
        </Link>
      ))}
      {friendGroups.length === 0 ? (
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      ) : null}
    </div>
  );
}
