import "server-only";

import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/authorization";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { createInviteToken, hashInviteToken } from "@/lib/league-invitations";
import { calculateRanking } from "@/lib/ranking";
import { rankingParticipantSelect } from "@/lib/data/ranking";
import { runSerializableTransaction } from "@/lib/transactions";
import { inviteTokenSchema, leagueIdSchema } from "@/lib/validation";

export async function listMyLeagues() {
  const { user } = await requireUser();
  const memberships = await getDb().leagueMember.findMany({
    where: { userId: user.id },
    select: {
      joinedAt: true,
      league: {
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

  return memberships.map(({ league, joinedAt }) => ({
    id: league.id,
    name: league.name,
    ownerName: league.owner.name,
    memberCount: league._count.members,
    isOwner: league.ownerId === user.id,
    joinedAt,
  }));
}

export async function listAdminLeagues() {
  const { user } = await requireAdmin();
  const leagues = await getDb().league.findMany({
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

  return leagues.map((league) => ({
    id: league.id,
    name: league.name,
    ownerName: league.owner.name,
    memberCount: league._count.members,
    isOwner: false,
  }));
}

export async function getLeagueDetail(id: string) {
  const { session, user } = await requireUser();
  const parsedId = leagueIdSchema.safeParse(id);
  if (!parsedId.success) {
    redirect(feedbackUrl("/ligas", { error: "league_not_found" }));
  }
  const canManageAnyLeague = isAdmin(session.user);

  const league = await getDb().league.findFirst({
    where: {
      id: parsedId.data,
      ...(canManageAnyLeague ? {} : { members: { some: { userId: user.id } } }),
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
  });

  if (!league) {
    redirect(feedbackUrl("/ligas", { error: "league_not_found" }));
  }

  const isOwner = league.ownerId === user.id;
  const isMember = league.members.some((member) => member.user.id === user.id);

  return {
    id: league.id,
    name: league.name,
    ownerName: league.owner.name,
    isOwner,
    isMember,
    canManage: isOwner || canManageAnyLeague,
    invitationEnabled: league.inviteTokenHash !== null,
    members: league.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      joinedAt: member.joinedAt,
      isOwner: member.user.id === league.ownerId,
    })),
    ranking: calculateRanking(
      league.members.map((member) => member.user),
      user.id,
    ),
  };
}

export async function getInvitePreview(token: string) {
  const { user } = await requireUser();
  const parsedToken = inviteTokenSchema.safeParse(token);
  if (!parsedToken.success) {
    return null;
  }

  const league = await getDb().league.findUnique({
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

  return league
    ? {
        id: league.id,
        name: league.name,
        ownerName: league.owner.name,
        isMember: league.members.length > 0,
      }
    : null;
}

export async function createLeague(name: string) {
  const { user } = await requireUser();
  const token = createInviteToken();
  const league = await getDb().league.create({
    data: {
      name,
      ownerId: user.id,
      inviteTokenHash: hashInviteToken(token),
      members: { create: { userId: user.id } },
    },
    select: { id: true },
  });

  return { id: league.id, token };
}

export async function rotateLeagueInvite(id: string) {
  const { session, user } = await requireUser();
  const token = createInviteToken();
  const update = await getDb().league.updateMany({
    where: leagueManagementWhere(id, user.id, isAdmin(session.user)),
    data: { inviteTokenHash: hashInviteToken(token) },
  });

  return update.count === 1 ? token : null;
}

export async function disableLeagueInvite(id: string) {
  const { session, user } = await requireUser();
  const update = await getDb().league.updateMany({
    where: leagueManagementWhere(id, user.id, isAdmin(session.user)),
    data: { inviteTokenHash: null },
  });

  return update.count === 1;
}

export async function joinLeagueWithInvite(token: string) {
  const { user } = await requireUser();
  return runSerializableTransaction(async (tx) => {
    const league = await tx.league.findUnique({
      where: { inviteTokenHash: hashInviteToken(token) },
      select: { id: true },
    });
    if (!league) {
      return { error: "invite_invalid" as const, leagueId: null };
    }

    await tx.leagueMember.upsert({
      where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
      create: { leagueId: league.id, userId: user.id },
      update: {},
    });
    return { error: null, leagueId: league.id };
  });
}

export async function removeLeagueMember(leagueId: string, memberId: string) {
  const { session, user } = await requireUser();
  return runSerializableTransaction(async (tx) => {
    const league = await tx.league.findFirst({
      where: leagueManagementWhere(leagueId, user.id, isAdmin(session.user)),
      select: { ownerId: true },
    });
    if (!league) {
      return "league_not_found" satisfies ErrorFeedbackCode;
    }
    if (league.ownerId === memberId) {
      return "invalid_member" satisfies ErrorFeedbackCode;
    }

    const removed = await tx.leagueMember.deleteMany({
      where: { leagueId, userId: memberId },
    });
    if (removed.count !== 1) {
      return "invalid_member" satisfies ErrorFeedbackCode;
    }

    await tx.league.update({
      where: { id: leagueId },
      data: { inviteTokenHash: null },
    });
    return null;
  });
}

export async function leaveLeague(id: string) {
  const { user } = await requireUser();
  return runSerializableTransaction(async (tx) => {
    const league = await tx.league.findFirst({
      where: {
        id,
        members: { some: { userId: user.id } },
      },
      select: { ownerId: true },
    });
    if (!league) {
      return "league_not_found" satisfies ErrorFeedbackCode;
    }
    if (league.ownerId === user.id) {
      return "owner_cannot_leave" satisfies ErrorFeedbackCode;
    }

    await tx.leagueMember.delete({
      where: { leagueId_userId: { leagueId: id, userId: user.id } },
    });
    return null;
  });
}

export async function deleteLeague(id: string) {
  const { session, user } = await requireUser();
  const deleted = await getDb().league.deleteMany({
    where: leagueManagementWhere(id, user.id, isAdmin(session.user)),
  });
  return deleted.count === 1;
}

function leagueManagementWhere(
  leagueId: string,
  userId: string,
  canManageAnyLeague: boolean,
) {
  return canManageAnyLeague ? { id: leagueId } : { id: leagueId, ownerId: userId };
}
