"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createFriendGroup,
  deleteFriendGroup,
  disableFriendGroupInvite,
  joinFriendGroupWithInvite,
  leaveFriendGroup,
  removeFriendGroupMember,
  rotateFriendGroupInvite,
} from "@/lib/data/friend-groups";
import { feedbackUrl, type ErrorFeedbackCode } from "@/lib/feedback";
import { isTransactionConflict } from "@/lib/transactions";
import {
  friendGroupIdSchema,
  friendGroupSchema,
  inviteTokenSchema,
  userIdSchema,
} from "@/lib/validation";

export type FriendGroupInviteState = {
  error?: ErrorFeedbackCode;
  success?: "friend_group_created";
  invitePath?: string;
  friendGroupId?: string;
};

export async function createFriendGroupAction(
  previousState: FriendGroupInviteState,
  formData: FormData,
): Promise<FriendGroupInviteState> {
  void previousState;
  const parsed = friendGroupSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: "invalid_friend_group" };
  }

  const friendGroup = await createFriendGroup(parsed.data.name);
  revalidatePath("/grupos-de-amigos");
  return {
    success: "friend_group_created",
    friendGroupId: friendGroup.id,
    invitePath: await inviteLink(friendGroup.token),
  };
}

export async function rotateFriendGroupInviteAction(
  id: string,
  previousState: FriendGroupInviteState,
  formData: FormData,
): Promise<FriendGroupInviteState> {
  void previousState;
  void formData;
  const parsedId = friendGroupIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "friend_group_not_found" };
  }

  const token = await rotateFriendGroupInvite(parsedId.data);
  if (!token) {
    return { error: "friend_group_not_found" };
  }

  revalidatePath(`/grupos-de-amigos/${parsedId.data}`);
  return { invitePath: await inviteLink(token) };
}

export async function disableFriendGroupInviteAction(id: string) {
  const parsedId = friendGroupIdSchema.safeParse(id);
  if (!parsedId.success || !(await disableFriendGroupInvite(parsedId.data))) {
    redirect(feedbackUrl("/grupos-de-amigos", { error: "friend_group_not_found" }));
  }

  revalidatePath(`/grupos-de-amigos/${parsedId.data}`);
  redirect(
    feedbackUrl(`/grupos-de-amigos/${parsedId.data}`, {
      success: "friend_group_invite_disabled",
    }),
  );
}

export async function joinFriendGroupAction(token: string) {
  const parsedToken = inviteTokenSchema.safeParse(token);
  if (!parsedToken.success) {
    redirect(feedbackUrl("/grupos-de-amigos", { error: "invite_invalid" }));
  }

  try {
    const result = await joinFriendGroupWithInvite(parsedToken.data);
    if (result.error || !result.friendGroupId) {
      redirect(
        feedbackUrl(`/grupos-de-amigos/convite/${parsedToken.data}`, {
          error: "invite_invalid",
        }),
      );
    }

    revalidatePath("/grupos-de-amigos");
    revalidatePath(`/grupos-de-amigos/${result.friendGroupId}`);
    redirect(
      feedbackUrl(`/grupos-de-amigos/${result.friendGroupId}`, {
        success: "friend_group_joined",
      }),
    );
  } catch (error) {
    if (!isTransactionConflict(error)) {
      throw error;
    }
    redirect(
      feedbackUrl(`/grupos-de-amigos/convite/${parsedToken.data}`, {
        error: "update_conflict",
      }),
    );
  }
}

export async function removeFriendGroupMemberAction(
  friendGroupId: string,
  memberId: string,
) {
  const parsedFriendGroupId = friendGroupIdSchema.safeParse(friendGroupId);
  const parsedMemberId = userIdSchema.safeParse(memberId);
  if (!parsedFriendGroupId.success || !parsedMemberId.success) {
    redirect(feedbackUrl("/grupos-de-amigos", { error: "friend_group_not_found" }));
  }

  let error: ErrorFeedbackCode | null;
  try {
    error = await removeFriendGroupMember(parsedFriendGroupId.data, parsedMemberId.data);
  } catch (transactionError) {
    if (!isTransactionConflict(transactionError)) {
      throw transactionError;
    }
    error = "update_conflict";
  }

  if (error) {
    redirect(feedbackUrl(`/grupos-de-amigos/${parsedFriendGroupId.data}`, { error }));
  }

  revalidatePath("/grupos-de-amigos");
  revalidatePath(`/grupos-de-amigos/${parsedFriendGroupId.data}`);
  redirect(
    feedbackUrl(`/grupos-de-amigos/${parsedFriendGroupId.data}`, {
      success: "friend_group_member_removed",
    }),
  );
}

export async function leaveFriendGroupAction(id: string) {
  const parsedId = friendGroupIdSchema.safeParse(id);
  if (!parsedId.success) {
    redirect(feedbackUrl("/grupos-de-amigos", { error: "friend_group_not_found" }));
  }

  let error: ErrorFeedbackCode | null;
  try {
    error = await leaveFriendGroup(parsedId.data);
  } catch (transactionError) {
    if (!isTransactionConflict(transactionError)) {
      throw transactionError;
    }
    error = "update_conflict";
  }

  if (error) {
    redirect(feedbackUrl(`/grupos-de-amigos/${parsedId.data}`, { error }));
  }

  revalidatePath("/grupos-de-amigos");
  redirect(feedbackUrl("/grupos-de-amigos", { success: "friend_group_left" }));
}

export async function deleteFriendGroupAction(id: string) {
  const parsedId = friendGroupIdSchema.safeParse(id);
  if (!parsedId.success || !(await deleteFriendGroup(parsedId.data))) {
    redirect(feedbackUrl("/grupos-de-amigos", { error: "friend_group_not_found" }));
  }

  revalidatePath("/grupos-de-amigos");
  redirect(feedbackUrl("/grupos-de-amigos", { success: "friend_group_deleted" }));
}

async function inviteLink(token: string) {
  const path = `/grupos-de-amigos/convite/${token}`;
  const origin = (await headers()).get("origin");
  return origin ? new URL(path, origin).toString() : path;
}
