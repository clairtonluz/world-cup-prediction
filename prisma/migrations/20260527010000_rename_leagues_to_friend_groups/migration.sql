ALTER TABLE "League" RENAME TO "FriendGroup";
ALTER TABLE "LeagueMember" RENAME TO "FriendGroupMember";
ALTER TABLE "FriendGroupMember" RENAME COLUMN "leagueId" TO "friendGroupId";

ALTER TABLE "FriendGroup" RENAME CONSTRAINT "League_pkey" TO "FriendGroup_pkey";
ALTER TABLE "FriendGroupMember" RENAME CONSTRAINT "LeagueMember_pkey" TO "FriendGroupMember_pkey";
ALTER TABLE "FriendGroup" RENAME CONSTRAINT "League_ownerId_fkey" TO "FriendGroup_ownerId_fkey";
ALTER TABLE "FriendGroupMember" RENAME CONSTRAINT "LeagueMember_leagueId_fkey" TO "FriendGroupMember_friendGroupId_fkey";
ALTER TABLE "FriendGroupMember" RENAME CONSTRAINT "LeagueMember_userId_fkey" TO "FriendGroupMember_userId_fkey";

ALTER INDEX "League_inviteTokenHash_key" RENAME TO "FriendGroup_inviteTokenHash_key";
ALTER INDEX "League_ownerId_idx" RENAME TO "FriendGroup_ownerId_idx";
ALTER INDEX "LeagueMember_userId_idx" RENAME TO "FriendGroupMember_userId_idx";
