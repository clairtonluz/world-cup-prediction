import "server-only";

import { notFound } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { hasEffectivelyStarted } from "@/lib/match-rules";

const matchSelect = {
  id: true,
  matchNumber: true,
  fifaMatchId: true,
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
        select: { teamAScore: true, teamBScore: true, points: true },
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
        select: { id: true, teamAScore: true, teamBScore: true, points: true },
        take: 1,
      },
    },
  });

  if (!match) {
    notFound();
  }

  if (!hasEffectivelyStarted(match)) {
    return { ...match, comparisonPredictions: null };
  }

  const comparisonPredictions = await db.prediction.findMany({
    where: { matchId: match.id },
    select: {
      id: true,
      teamAScore: true,
      teamBScore: true,
      points: true,
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return { ...match, comparisonPredictions };
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
