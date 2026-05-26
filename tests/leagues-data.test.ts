import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteLeague,
  disableLeagueInvite,
  getLeagueDetail,
  listAdminLeagues,
  removeLeagueMember,
  rotateLeagueInvite,
} from "@/lib/data/leagues";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  redirect: vi.fn(),
  leagueFindMany: vi.fn(),
  leagueFindFirst: vi.fn(),
  leagueUpdateMany: vi.fn(),
  leagueDeleteMany: vi.fn(),
  transactionLeagueFindFirst: vi.fn(),
  transactionLeagueUpdate: vi.fn(),
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
    league: {
      findMany: mocks.leagueFindMany,
      findFirst: mocks.leagueFindFirst,
      updateMany: mocks.leagueUpdateMany,
      deleteMany: mocks.leagueDeleteMany,
    },
  }),
}));
vi.mock("@/lib/transactions", () => ({
  runSerializableTransaction: <T,>(
    operation: (transaction: {
      league: {
        findFirst: typeof mocks.transactionLeagueFindFirst;
        update: typeof mocks.transactionLeagueUpdate;
      };
      leagueMember: { deleteMany: typeof mocks.transactionMemberDeleteMany };
    }) => Promise<T>,
  ) =>
    operation({
      league: {
        findFirst: mocks.transactionLeagueFindFirst,
        update: mocks.transactionLeagueUpdate,
      },
      leagueMember: { deleteMany: mocks.transactionMemberDeleteMany },
    }),
}));

const LEAGUE_ID = "cleague123";
const OWNER_ID = "cowner123";
const ADMIN_ID = "cadmin123";
const MEMBER_ID = "cmember123";

function authenticatedUser(id: string, roles: Array<"USER" | "ADMIN">) {
  return {
    session: { user: { roles } },
    user: { id },
  };
}

function leagueWithMembers(memberIds: string[]) {
  return {
    id: LEAGUE_ID,
    name: "Liga dos Amigos",
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

describe("administrative league listing", () => {
  it("requires the admin guard before reading leagues", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("forbidden"));

    await expect(listAdminLeagues()).rejects.toThrow("forbidden");
    expect(mocks.leagueFindMany).not.toHaveBeenCalled();
  });

  it("excludes leagues owned by or joined by the administrator", async () => {
    mocks.leagueFindMany.mockResolvedValue([
      {
        id: LEAGUE_ID,
        name: "Liga dos Amigos",
        ownerId: OWNER_ID,
        owner: { name: "Criador" },
        _count: { members: 2 },
      },
    ]);

    await expect(listAdminLeagues()).resolves.toEqual([
      {
        id: LEAGUE_ID,
        name: "Liga dos Amigos",
        ownerName: "Criador",
        memberCount: 2,
        isOwner: false,
      },
    ]);
    expect(mocks.leagueFindMany).toHaveBeenCalledWith(
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

describe("league detail access", () => {
  it("scopes a regular user's lookup to their memberships", async () => {
    mocks.leagueFindFirst.mockResolvedValue(null);

    await expect(getLeagueDetail(LEAGUE_ID)).rejects.toThrow(
      "redirect:/ligas?error=league_not_found",
    );
    expect(mocks.leagueFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: LEAGUE_ID,
          members: { some: { userId: MEMBER_ID } },
        },
      }),
    );
  });

  it("allows an administrator to read and manage an external league", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.leagueFindFirst.mockResolvedValue(leagueWithMembers([OWNER_ID, MEMBER_ID]));

    const league = await getLeagueDetail(LEAGUE_ID);

    expect(mocks.leagueFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: LEAGUE_ID } }),
    );
    expect(league).toMatchObject({
      id: LEAGUE_ID,
      isOwner: false,
      isMember: false,
      canManage: true,
    });
  });

  it("allows a creator to manage their own league", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(OWNER_ID, ["USER"]));
    mocks.leagueFindFirst.mockResolvedValue(leagueWithMembers([OWNER_ID]));

    await expect(getLeagueDetail(LEAGUE_ID)).resolves.toMatchObject({
      isOwner: true,
      isMember: true,
      canManage: true,
    });
  });

  it("keeps participation visible when an administrator is also a member", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.leagueFindFirst.mockResolvedValue(leagueWithMembers([OWNER_ID, ADMIN_ID]));

    await expect(getLeagueDetail(LEAGUE_ID)).resolves.toMatchObject({
      isOwner: false,
      isMember: true,
      canManage: true,
    });
  });
});

describe("league management authorization", () => {
  it("allows administrators to manage invitation settings and delete any league", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.leagueUpdateMany.mockResolvedValue({ count: 1 });
    mocks.leagueDeleteMany.mockResolvedValue({ count: 1 });

    await expect(rotateLeagueInvite(LEAGUE_ID)).resolves.toEqual(expect.any(String));
    await expect(disableLeagueInvite(LEAGUE_ID)).resolves.toBe(true);
    await expect(deleteLeague(LEAGUE_ID)).resolves.toBe(true);

    expect(mocks.leagueUpdateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { id: LEAGUE_ID } }),
    );
    expect(mocks.leagueUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { id: LEAGUE_ID } }),
    );
    expect(mocks.leagueDeleteMany).toHaveBeenCalledWith({ where: { id: LEAGUE_ID } });
  });

  it("continues to allow creators to manage leagues they own", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(OWNER_ID, ["USER"]));
    mocks.leagueUpdateMany.mockResolvedValue({ count: 1 });
    mocks.leagueDeleteMany.mockResolvedValue({ count: 1 });

    await expect(disableLeagueInvite(LEAGUE_ID)).resolves.toBe(true);
    await expect(deleteLeague(LEAGUE_ID)).resolves.toBe(true);

    expect(mocks.leagueUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: LEAGUE_ID, ownerId: OWNER_ID } }),
    );
    expect(mocks.leagueDeleteMany).toHaveBeenCalledWith({
      where: { id: LEAGUE_ID, ownerId: OWNER_ID },
    });
  });

  it("limits regular management mutations to leagues owned by the user", async () => {
    mocks.leagueUpdateMany.mockResolvedValue({ count: 0 });
    mocks.leagueDeleteMany.mockResolvedValue({ count: 0 });

    await expect(disableLeagueInvite(LEAGUE_ID)).resolves.toBe(false);
    await expect(deleteLeague(LEAGUE_ID)).resolves.toBe(false);

    expect(mocks.leagueUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: LEAGUE_ID, ownerId: MEMBER_ID } }),
    );
    expect(mocks.leagueDeleteMany).toHaveBeenCalledWith({
      where: { id: LEAGUE_ID, ownerId: MEMBER_ID },
    });
  });

  it("lets an administrator remove a non-owner and disables the previous invite", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.transactionLeagueFindFirst.mockResolvedValue({ ownerId: OWNER_ID });
    mocks.transactionMemberDeleteMany.mockResolvedValue({ count: 1 });

    await expect(removeLeagueMember(LEAGUE_ID, MEMBER_ID)).resolves.toBeNull();
    expect(mocks.transactionLeagueFindFirst).toHaveBeenCalledWith({
      where: { id: LEAGUE_ID },
      select: { ownerId: true },
    });
    expect(mocks.transactionLeagueUpdate).toHaveBeenCalledWith({
      where: { id: LEAGUE_ID },
      data: { inviteTokenHash: null },
    });
  });

  it("does not allow an administrator to remove the league creator", async () => {
    mocks.requireUser.mockResolvedValue(authenticatedUser(ADMIN_ID, ["ADMIN"]));
    mocks.transactionLeagueFindFirst.mockResolvedValue({ ownerId: OWNER_ID });

    await expect(removeLeagueMember(LEAGUE_ID, OWNER_ID)).resolves.toBe("invalid_member");
    expect(mocks.transactionMemberDeleteMany).not.toHaveBeenCalled();
    expect(mocks.transactionLeagueUpdate).not.toHaveBeenCalled();
  });
});
