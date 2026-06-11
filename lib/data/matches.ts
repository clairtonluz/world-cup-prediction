import "server-only";

import { notFound } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { hasEffectivelyStarted } from "@/lib/match-rules";

const matchSelect = {
  id: true,
  matchNumber: true,
  fifaMatchId: true,
  espnEventId: true,
  scoreSyncLocked: true,
  teamA: true,
  teamB: true,
  teamASlot: true,
  teamBSlot: true,
  participantsConfirmed: true,
  stage: true,
  groupCode: true,
  groupRound: true,
  startsAt: true,
  venue: true,
  hostCity: true,
  status: true,
  teamAScore: true,
  teamBScore: true,
  advancingTeam: true,
  predictionsResetAt: true,
} as const;

export async function listMatches() {
  const { user } = await requireUser();
  return getDb().match.findMany({
    select: {
      ...matchSelect,
      predictions: {
        where: { userId: user.id },
        select: { teamAScore: true, teamBScore: true, predictedAdvancingTeam: true, points: true },
        take: 1,
      },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function listGroupMatches() {
  await requireUser();
  return getDb().match.findMany({
    where: { stage: "GROUP_STAGE" },
    select: matchSelect,
    orderBy: [{ groupCode: "asc" }, { groupRound: "asc" }, { startsAt: "asc" }],
  });
}

export async function getMatchDetail(id: string) {
  const { user } = await requireUser();
  const db = getDb();
  const match = await db.match.findUnique({
    where: { id },
    select: {
      ...matchSelect,
      predictions: {
        where: { userId: user.id },
        select: {
          id: true,
          teamAScore: true,
          teamBScore: true,
          predictedAdvancingTeam: true,
          points: true,
        },
        take: 1,
      },
    },
  });

  if (!match) {
    notFound();
  }

  if (!hasEffectivelyStarted(match)) {
    return { ...match, comparisonPredictionGroups: null };
  }

  const friendGroups = await db.friendGroup.findMany({
    where: {
      AND: [
        { members: { some: { userId: user.id } } },
        {
          members: {
            some: {
              user: {
                predictions: { some: { matchId: match.id } },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      members: {
        where: {
          user: {
            predictions: { some: { matchId: match.id } },
          },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              predictions: {
                where: { matchId: match.id },
                select: {
                  id: true,
                  teamAScore: true,
                  teamBScore: true,
                  predictedAdvancingTeam: true,
                  points: true,
                },
              },
            },
          },
        },
        orderBy: [{ user: { name: "asc" } }, { userId: "asc" }],
      },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  const comparisonPredictionGroups = friendGroups.map((friendGroup) => ({
    id: friendGroup.id,
    name: friendGroup.name,
    predictions: friendGroup.members.flatMap((member) =>
      member.user.predictions.map((prediction) => ({
        ...prediction,
        user: {
          id: member.user.id,
          name: member.user.name,
          image: member.user.image,
        },
      })),
    ),
  }));

  return { ...match, comparisonPredictionGroups };
}

export async function listAdminMatches() {
  await requireAdmin();
  return getDb().match.findMany({
    select: matchSelect,
    orderBy: { startsAt: "asc" },
  });
}

export async function getAdminMatch(id: string) {
  await requireAdmin();
  const match = await getDb().match.findUnique({
    where: { id },
    select: matchSelect,
  });

  if (!match) {
    notFound();
  }

  return match;
}
