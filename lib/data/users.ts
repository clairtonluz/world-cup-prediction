import "server-only";

import { requireAdmin } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";

export async function searchAdminUsers(query: string) {
  await requireAdmin();

  const users = await getDb().user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {},
    select: {
      id: true,
      name: true,
      email: true,
      hiddenFromGlobalRanking: true,
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return users;
}
