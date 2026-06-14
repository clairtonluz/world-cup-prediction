import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";

export async function getAdminUsersPageData(query: string) {
  await requireAdmin();

  const db = getDb();
  const where = adminUserSearchWhere(query);
  const [users, totalUsers] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        hiddenFromGlobalRanking: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
    }),
    db.user.count(),
  ]);

  return { users, totalUsers };
}

function adminUserSearchWhere(query: string): Prisma.UserWhereInput {
  if (!query) {
    return {};
  }

  return {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ],
  };
}
