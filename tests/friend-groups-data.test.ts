import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteFriendGroup,
  disableFriendGroupInvite,
  getFriendGroupDetail,
  listAdminFriendGroups,
  removeFriendGroupMember,
  rotateFriendGroupInvite,
} from "@/lib/data/friend-groups";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  redirect: vi.fn(),
  friendGroupFindMany: vi.fn(),
  friendGroupFindFirst: vi.fn(),
  friendGroupUpdateMany: vi.fn(),
  friendGroupDeleteMany: vi.fn(),
  transactionFriendGroupFindFirst: vi.fn(),
  transactionFriendGroupUpdate: vi.fn(),
  transactionMemberDeleteMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("@/lib/auth-guards", () => ({
  requireUser: mocks.requireUser,
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    friendGroup: {
      findMany: mocks.friendGroupFindMany,
      findFirst: mocks.friendGroupFindFirst,
      updateMany: mocks.friendGroupUpdateMany,
      deleteMany: mocks.friendGroupDeleteMany,
    },
  }),
}));
vi.mock("@/lib/transactions", () => ({
  runSerializableTransaction: <T,>(
    operation: (transaction: {
      friendGroup: {
        findFirst: typeof mocks.transactionFriendGroupFindFirst;
        update: typeof mocks.transactionFriendGroupUpdate;
      };
      friendGroupMember: { deleteMany: typeof mocks.transactionMemberDeleteMany };
    }) => Promise<T>,
  ) =>
    operation({
      friendGroup: {
        findFirst: mocks.transactionFriendGroupFindFirst,
        update: mocks.transactionFriendGroupUpdate,
      },
      friendGroupMember: { deleteMany: mocks.transactionMemberDeleteMany },
    }),
}));

const FRIEND_GROUP_ID = "cfriendgroup123";
const OWNER_ID = "cowner123";
const ADMIN_ID = "cadmin123";
const MEMBER_ID = "cmember123";

function authenticatedUser(id: string, roles: Array<"USER" | "ADMIN">) {
  return {
    session: { user: { roles } },
    user: { id },
  };
}

function friendGroupWithMembers(memberIds: string[]) {
  return {
    id: FRIEND_GROUP_ID,
    name: "Grupo da Copa",
    ownerId: OWNER_ID,
    inviteTokenHash: "enabled",
    owner: { name: "Criador" },
    members: memberIds.map((id) => ({
      joinedAt: new Date("2026-05-26T00:00:00Z"),
      user: {
        id,
        name: id === OWNER_ID ? "Criador" : "Participante",
        image: null,
        predictions: [],
      },
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`redirect:${url}`);
  });
  mocks.requireUser.mockResolvedValue(authenticatedUser(MEMBER_ID, ["USER"]));
  mocks.requireAdmin.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
});

describe("administrative friend group listing", () => {
  it("requires the admin guard before reading friend groups", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("forbidden"));

    await expect(listAdminFriendGroups()).rejects.toThrow("forbidden");
    expect(mocks.friendGroupFindMany).not.toHaveBeenCalled();
  });

  it("excludes friend groups owned by or joined by the administrator", async () => {
    mocks.friendGroupFindMany.mockResolvedValue([
      {
        id: FRIEND_GROUP_ID,
        name: "Grupo da Copa",
        ownerId: OWNER_ID,
        owner: { name: "Criador" },
        _count: { members: 2 },
      },
    ]);

    await expect(listAdminFriendGroups()).resolves.toEqual([
      {
        id: FRIEND_GROUP_ID,
        name: "Grupo da Copa",
        ownerName: "Criador",
        memberCount: 2,
        isOwner: false,
      },
    ]);
    expect(mocks.friendGroupFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerId: { not: ADMIN_ID },
          members: { none: { userId: ADMIN_ID } },
        },
        orderBy: { createdAt: "desc" },
      }),
    );
  });
});

describe("friend group detail access", () => {
  it("scopes a regular user's lookup to their memberships", async () => {
    mocks.friendGroupFindFirst.mockResolvedValue(null);

    await expect(getFriendGroupDetail(FRIEND_GROUP_ID)).rejects.toThrow(
      "redirect:/grupos-de-amigos?error=friend_group_not_found",
    );
    expect(mocks.friendGroupFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: FRIEND_GROUP_ID,
          members: { some: { userId: MEMBER_ID } },
        },
      }),
    );
  });

  it("allows an administrator to read and manage an external friend group", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.friendGroupFindFirst.mockResolvedValue(friendGroupWithMembers([OWNER_ID, MEMBER_ID]));

    const friendGroup = await getFriendGroupDetail(FRIEND_GROUP_ID);

    expect(mocks.friendGroupFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: FRIEND_GROUP_ID } }),
    );
    expect(friendGroup).toMatchObject({
      id: FRIEND_GROUP_ID,
      isOwner: false,
      isMember: false,
      canManage: true,
    });
  });

  it("allows a creator to manage their own friend group", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(OWNER_ID, ["USER"]));
    mocks.friendGroupFindFirst.mockResolvedValue(friendGroupWithMembers([OWNER_ID]));

    await expect(getFriendGroupDetail(FRIEND_GROUP_ID)).resolves.toMatchObject({
      isOwner: true,
      isMember: true,
      canManage: true,
    });
  });

  it("keeps participation visible when an administrator is also a member", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.friendGroupFindFirst.mockResolvedValue(friendGroupWithMembers([OWNER_ID, ADMIN_ID]));

    await expect(getFriendGroupDetail(FRIEND_GROUP_ID)).resolves.toMatchObject({
      isOwner: false,
      isMember: true,
      canManage: true,
    });
  });
});

describe("friend group management authorization", () => {
  it("allows administrators to manage invitation settings and delete any friend group", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.friendGroupUpdateMany.mockResolvedValue({ count: 1 });
    mocks.friendGroupDeleteMany.mockResolvedValue({ count: 1 });

    await expect(rotateFriendGroupInvite(FRIEND_GROUP_ID)).resolves.toEqual(expect.any(String));
    await expect(disableFriendGroupInvite(FRIEND_GROUP_ID)).resolves.toBe(true);
    await expect(deleteFriendGroup(FRIEND_GROUP_ID)).resolves.toBe(true);

    expect(mocks.friendGroupUpdateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { id: FRIEND_GROUP_ID } }),
    );
    expect(mocks.friendGroupUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { id: FRIEND_GROUP_ID } }),
    );
    expect(mocks.friendGroupDeleteMany).toHaveBeenCalledWith({ where: { id: FRIEND_GROUP_ID } });
  });

  it("continues to allow creators to manage friend groups they own", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(OWNER_ID, ["USER"]));
    mocks.friendGroupUpdateMany.mockResolvedValue({ count: 1 });
    mocks.friendGroupDeleteMany.mockResolvedValue({ count: 1 });

    await expect(disableFriendGroupInvite(FRIEND_GROUP_ID)).resolves.toBe(true);
    await expect(deleteFriendGroup(FRIEND_GROUP_ID)).resolves.toBe(true);

    expect(mocks.friendGroupUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: FRIEND_GROUP_ID, ownerId: OWNER_ID } }),
    );
    expect(mocks.friendGroupDeleteMany).toHaveBeenCalledWith({
      where: { id: FRIEND_GROUP_ID, ownerId: OWNER_ID },
    });
  });

  it("limits regular management mutations to friend groups owned by the user", async () => {
    mocks.friendGroupUpdateMany.mockResolvedValue({ count: 0 });
    mocks.friendGroupDeleteMany.mockResolvedValue({ count: 0 });

    await expect(disableFriendGroupInvite(FRIEND_GROUP_ID)).resolves.toBe(false);
    await expect(deleteFriendGroup(FRIEND_GROUP_ID)).resolves.toBe(false);

    expect(mocks.friendGroupUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: FRIEND_GROUP_ID, ownerId: MEMBER_ID } }),
    );
    expect(mocks.friendGroupDeleteMany).toHaveBeenCalledWith({
      where: { id: FRIEND_GROUP_ID, ownerId: MEMBER_ID },
    });
  });

  it("lets an administrator remove a non-owner and disables the previous invite", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.transactionFriendGroupFindFirst.mockResolvedValue({ ownerId: OWNER_ID });
    mocks.transactionMemberDeleteMany.mockResolvedValue({ count: 1 });

    await expect(removeFriendGroupMember(FRIEND_GROUP_ID, MEMBER_ID)).resolves.toBeNull();
    expect(mocks.transactionFriendGroupFindFirst).toHaveBeenCalledWith({
      where: { id: FRIEND_GROUP_ID },
      select: { ownerId: true },
    });
    expect(mocks.transactionFriendGroupUpdate).toHaveBeenCalledWith({
      where: { id: FRIEND_GROUP_ID },
      data: { inviteTokenHash: null },
    });
  });

  it("does not allow an administrator to remove the friend group creator", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.transactionFriendGroupFindFirst.mockResolvedValue({ ownerId: OWNER_ID });

    await expect(removeFriendGroupMember(FRIEND_GROUP_ID, OWNER_ID)).resolves.toBe("invalid_member");
    expect(mocks.transactionMemberDeleteMany).not.toHaveBeenCalled();
    expect(mocks.transactionFriendGroupUpdate).not.toHaveBeenCalled();
  });
});
