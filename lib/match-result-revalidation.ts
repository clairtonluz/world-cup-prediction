import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateMatchResultViews(matchId?: string) {
  revalidatePath("/admin/matches");
  revalidatePath("/admin/matches/[id]/edit", "page");
  revalidatePath("/matches");
  revalidatePath("/matches/[id]", "page");
  if (matchId) {
    revalidatePath(`/matches/${matchId}`);
  }
  revalidatePath("/apostas");
  revalidatePath("/grupos");
  revalidatePath("/grupos-de-amigos");
  revalidatePath("/grupos-de-amigos/[id]", "page");
  revalidatePath("/ranking");
  revalidatePath("/me");
}
