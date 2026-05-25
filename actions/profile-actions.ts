"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { feedbackUrl } from "@/lib/feedback";
import { favoriteTeamSchema } from "@/lib/validation";

export async function updateFavoriteTeamAction(formData: FormData) {
  const { user } = await requireUser();
  const parsed = favoriteTeamSchema.safeParse({
    favoriteTeam: formData.get("favoriteTeam"),
  });

  if (!parsed.success) {
    redirect(feedbackUrl("/me", { error: "invalid_favorite_team" }));
  }

  await getDb().user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  revalidatePath("/me");
  redirect(feedbackUrl("/me", { success: "favorite_team_updated" }));
}
