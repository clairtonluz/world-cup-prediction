import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin, isUser } from "@/lib/authorization";
import { getDb } from "@/lib/db";

export const requireUser = cache(async () => {
  const session = await auth();

  if (!session?.user || session.error) {
    redirect("/login?error=session");
  }

  if (!isUser(session.user)) {
    redirect("/login?error=forbidden");
  }

  const user = await getDb().user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login?error=account");
  }

  return { session, user };
});

export const requireAdmin = cache(async () => {
  const context = await requireUser();

  if (!isAdmin(context.session.user)) {
    redirect("/matches?error=admin");
  }

  return context;
});
