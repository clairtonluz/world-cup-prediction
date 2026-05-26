"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createLeague,
  deleteLeague,
  disableLeagueInvite,
  joinLeagueWithInvite,
  leaveLeague,
  removeLeagueMember,
  rotateLeagueInvite,
} from "@/lib/data/leagues";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { isTransactionConflict } from "@/lib/transactions";
import {
  inviteTokenSchema,
  leagueIdSchema,
  leagueSchema,
  userIdSchema,
} from "@/lib/validation";

export type LeagueInviteState = {
  error?: ErrorFeedbackCode;
  success?: "league_created";
  invitePath?: string;
  leagueId?: string;
};

export async function createLeagueAction(
  previousState: LeagueInviteState,
  formData: FormData,
): Promise<LeagueInviteState> {
  void previousState;
  const parsed = leagueSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: "invalid_league" };
  }

  const league = await createLeague(parsed.data.name);
  revalidatePath("/ligas");
  return {
    success: "league_created",
    leagueId: league.id,
    invitePath: await inviteLink(league.token),
  };
}

export async function rotateLeagueInviteAction(
  id: string,
  previousState: LeagueInviteState,
  formData: FormData,
): Promise<LeagueInviteState> {
  void previousState;
  void formData;
  const parsedId = leagueIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "league_not_found" };
  }

  const token = await rotateLeagueInvite(parsedId.data);
  if (!token) {
    return { error: "league_not_found" };
  }

  revalidatePath(`/ligas/${parsedId.data}`);
  return { invitePath: await inviteLink(token) };
}

export async function disableLeagueInviteAction(id: string) {
  const parsedId = leagueIdSchema.safeParse(id);
  if (!parsedId.success || !(await disableLeagueInvite(parsedId.data))) {
    redirect(feedbackUrl("/ligas", { error: "league_not_found" }));
  }

  revalidatePath(`/ligas/${parsedId.data}`);
  redirect(feedbackUrl(`/ligas/${parsedId.data}`, { success: "league_invite_disabled" }));
}

export async function joinLeagueAction(token: string) {
  const parsedToken = inviteTokenSchema.safeParse(token);
  if (!parsedToken.success) {
    redirect(feedbackUrl("/ligas", { error: "invite_invalid" }));
  }

  try {
    const result = await joinLeagueWithInvite(parsedToken.data);
    if (result.error || !result.leagueId) {
      redirect(feedbackUrl(`/ligas/convite/${parsedToken.data}`, { error: "invite_invalid" }));
    }

    revalidatePath("/ligas");
    revalidatePath(`/ligas/${result.leagueId}`);
    redirect(feedbackUrl(`/ligas/${result.leagueId}`, { success: "league_joined" }));
  } catch (error) {
    if (!isTransactionConflict(error)) {
      throw error;
    }
    redirect(feedbackUrl(`/ligas/convite/${parsedToken.data}`, { error: "update_conflict" }));
  }
}

export async function removeLeagueMemberAction(
  leagueId: string,
  memberId: string,
) {
  const parsedLeagueId = leagueIdSchema.safeParse(leagueId);
  const parsedMemberId = userIdSchema.safeParse(memberId);
  if (!parsedLeagueId.success || !parsedMemberId.success) {
    redirect(feedbackUrl("/ligas", { error: "league_not_found" }));
  }

  let error: ErrorFeedbackCode | null;
  try {
    error = await removeLeagueMember(parsedLeagueId.data, parsedMemberId.data);
  } catch (transactionError) {
    if (!isTransactionConflict(transactionError)) {
      throw transactionError;
    }
    error = "update_conflict";
  }

  if (error) {
    redirect(feedbackUrl(`/ligas/${parsedLeagueId.data}`, { error }));
  }

  revalidatePath("/ligas");
  revalidatePath(`/ligas/${parsedLeagueId.data}`);
  redirect(feedbackUrl(`/ligas/${parsedLeagueId.data}`, { success: "league_member_removed" }));
}

export async function leaveLeagueAction(id: string) {
  const parsedId = leagueIdSchema.safeParse(id);
  if (!parsedId.success) {
    redirect(feedbackUrl("/ligas", { error: "league_not_found" }));
  }

  let error: ErrorFeedbackCode | null;
  try {
    error = await leaveLeague(parsedId.data);
  } catch (transactionError) {
    if (!isTransactionConflict(transactionError)) {
      throw transactionError;
    }
    error = "update_conflict";
  }

  if (error) {
    redirect(feedbackUrl(`/ligas/${parsedId.data}`, { error }));
  }

  revalidatePath("/ligas");
  redirect(feedbackUrl("/ligas", { success: "league_left" }));
}

export async function deleteLeagueAction(id: string) {
  const parsedId = leagueIdSchema.safeParse(id);
  if (!parsedId.success || !(await deleteLeague(parsedId.data))) {
    redirect(feedbackUrl("/ligas", { error: "league_not_found" }));
  }

  revalidatePath("/ligas");
  redirect(feedbackUrl("/ligas", { success: "league_deleted" }));
}

async function inviteLink(token: string) {
  const path = `/ligas/convite/${token}`;
  const origin = (await headers()).get("origin");
  return origin ? new URL(path, origin).toString() : path;
}
