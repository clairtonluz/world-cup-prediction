import "server-only";

import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/authorization";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { createInviteToken, hashInviteToken } from "@/lib/friend-group-invitations";
import { calculateRanking } from "@/lib/ranking";
import { getRankingContext, rankingParticipantSelect } from "@/lib/data/ranking";
import { runSerializableTransaction } from "@/lib/transactions";
import { friendGroupIdSchema, inviteTokenSchema } from "@/lib/validation";

export async function listMyFriendGroups() {
  const { user } = await requireUser();
  const memberships = await getDb().friendGroupMember.findMany({
    where: { userId: user.id },
    select: {
      joinedAt: true,
      friendGroup: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          owner: { select: { name: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map(({ friendGroup, joinedAt }) => ({
    id: friendGroup.id,
    name: friendGroup.name,
    ownerName: friendGroup.owner.name,
    memberCount: friendGroup._count.members,
    isOwner: friendGroup.ownerId === user.id,
    joinedAt,
  }));
}

export async function listAdminFriendGroups() {
  const { user } = await requireAdmin();
  const friendGroups = await getDb().friendGroup.findMany({
    where: {
      ownerId: { not: user.id },
      members: { none: { userId: user.id } },
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      owner: { select: { name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return friendGroups.map((friendGroup) => ({
    id: friendGroup.id,
    name: friendGroup.name,
    ownerName: friendGroup.owner.name,
    memberCount: friendGroup._count.members,
    isOwner: false,
  }));
}

export async function getFriendGroupDetail(id: string) {
  const { session, user } = await requireUser();
  const parsedId = friendGroupIdSchema.safeParse(id);
  if (!parsedId.success) {
    redirect(feedbackUrl("/grupos-de-amigos", { error: "friend_group_not_found" }));
  }
  const canManageAnyFriendGroup = isAdmin(session.user);

  const [friendGroup, rankingContext] = await Promise.all([
    getDb().friendGroup.findFirst({
      where: {
        id: parsedId.data,
        ...(canManageAnyFriendGroup ? {} : { members: { some: { userId: user.id } } }),
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        inviteTokenHash: true,
        owner: { select: { name: true } },
        members: {
          select: {
            joinedAt: true,
            user: { select: rankingParticipantSelect },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    }),
    getRankingContext(),
  ]);

  if (!friendGroup) {
    redirect(feedbackUrl("/grupos-de-amigos", { error: "friend_group_not_found" }));
  }

  const isOwner = friendGroup.ownerId === user.id;
  const isMember = friendGroup.members.some((member) => member.user.id === user.id);

  return {
    id: friendGroup.id,
    name: friendGroup.name,
    ownerName: friendGroup.owner.name,
    isOwner,
    isMember,
    canManage: isOwner || canManageAnyFriendGroup,
    invitationEnabled: friendGroup.inviteTokenHash !== null,
    members: friendGroup.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      joinedAt: member.joinedAt,
      isOwner: member.user.id === friendGroup.ownerId,
    })),
    ranking: calculateRanking(
      friendGroup.members.map((member) => member.user),
      user.id,
      rankingContext,
    ),
  };
}

export async function getInvitePreview(token: string) {
  const { user } = await requireUser();
  const parsedToken = inviteTokenSchema.safeParse(token);
  if (!parsedToken.success) {
    return null;
  }

  const friendGroup = await getDb().friendGroup.findUnique({
    where: { inviteTokenHash: hashInviteToken(parsedToken.data) },
    select: {
      id: true,
      name: true,
      owner: { select: { name: true } },
      members: {
        where: { userId: user.id },
        select: { userId: true },
        take: 1,
      },
    },
  });

  return friendGroup
    ? {
        id: friendGroup.id,
        name: friendGroup.name,
        ownerName: friendGroup.owner.name,
        isMember: friendGroup.members.length > 0,
      }
    : null;
}

export async function createFriendGroup(name: string) {
  const { user } = await requireUser();
  const token = createInviteToken();
  const friendGroup = await getDb().friendGroup.create({
    data: {
      name,
      ownerId: user.id,
      inviteTokenHash: hashInviteToken(token),
      members: { create: { userId: user.id } },
    },
    select: { id: true },
  });

  return { id: friendGroup.id, token };
}

export async function rotateFriendGroupInvite(id: string) {
  const { session, user } = await requireUser();
  const token = createInviteToken();
  const update = await getDb().friendGroup.updateMany({
    where: friendGroupManagementWhere(id, user.id, isAdmin(session.user)),
    data: { inviteTokenHash: hashInviteToken(token) },
  });

  return update.count === 1 ? token : null;
}

export async function disableFriendGroupInvite(id: string) {
  const { session, user } = await requireUser();
  const update = await getDb().friendGroup.updateMany({
    where: friendGroupManagementWhere(id, user.id, isAdmin(session.user)),
    data: { inviteTokenHash: null },
  });

  return update.count === 1;
}

export async function joinFriendGroupWithInvite(token: string) {
  const { user } = await requireUser();
  return runSerializableTransaction(async (tx) => {
    const friendGroup = await tx.friendGroup.findUnique({
      where: { inviteTokenHash: hashInviteToken(token) },
      select: { id: true },
    });
    if (!friendGroup) {
      return { error: "invite_invalid" as const, friendGroupId: null };
    }

    await tx.friendGroupMember.upsert({
      where: { friendGroupId_userId: { friendGroupId: friendGroup.id, userId: user.id } },
      create: { friendGroupId: friendGroup.id, userId: user.id },
      update: {},
    });
    return { error: null, friendGroupId: friendGroup.id };
  });
}

export async function removeFriendGroupMember(friendGroupId: string, memberId: string) {
  const { session, user } = await requireUser();
  return runSerializableTransaction(async (tx) => {
    const friendGroup = await tx.friendGroup.findFirst({
      where: friendGroupManagementWhere(friendGroupId, user.id, isAdmin(session.user)),
      select: { ownerId: true },
    });
    if (!friendGroup) {
      return "friend_group_not_found" satisfies ErrorFeedbackCode;
    }
    if (friendGroup.ownerId === memberId) {
      return "invalid_member" satisfies ErrorFeedbackCode;
    }

    const removed = await tx.friendGroupMember.deleteMany({
      where: { friendGroupId, userId: memberId },
    });
    if (removed.count !== 1) {
      return "invalid_member" satisfies ErrorFeedbackCode;
    }

    await tx.friendGroup.update({
      where: { id: friendGroupId },
      data: { inviteTokenHash: null },
    });
    return null;
  });
}

export async function leaveFriendGroup(id: string) {
  const { user } = await requireUser();
  return runSerializableTransaction(async (tx) => {
    const friendGroup = await tx.friendGroup.findFirst({
      where: {
        id,
        members: { some: { userId: user.id } },
      },
      select: { ownerId: true },
    });
    if (!friendGroup) {
      return "friend_group_not_found" satisfies ErrorFeedbackCode;
    }
    if (friendGroup.ownerId === user.id) {
      return "owner_cannot_leave" satisfies ErrorFeedbackCode;
    }

    await tx.friendGroupMember.delete({
      where: { friendGroupId_userId: { friendGroupId: id, userId: user.id } },
    });
    return null;
  });
}

export async function deleteFriendGroup(id: string) {
  const { session, user } = await requireUser();
  const deleted = await getDb().friendGroup.deleteMany({
    where: friendGroupManagementWhere(id, user.id, isAdmin(session.user)),
  });
  return deleted.count === 1;
}

function friendGroupManagementWhere(
  friendGroupId: string,
  userId: string,
  canManageAnyFriendGroup: boolean,
) {
  return canManageAnyFriendGroup
    ? { id: friendGroupId }
    : { id: friendGroupId, ownerId: userId };
}
