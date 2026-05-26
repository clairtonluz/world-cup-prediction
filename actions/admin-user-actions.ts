"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";

export async function toggleUserRankingVisibility(userId: string, hidden: boolean) {
  await requireAdmin();

  await getDb().user.update({
    where: { id: userId },
    data: { hiddenFromGlobalRanking: hidden },
  });

  revalidatePath("/ranking");
  revalidatePath("/admin/users");
}
