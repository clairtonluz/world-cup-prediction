import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminUsersPageData } from "@/lib/data/users";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  userFindMany: vi.fn(),
  userCount: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth-guards", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    user: {
      findMany: mocks.userFindMany,
      count: mocks.userCount,
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ user: { id: "admin" } });
  mocks.userFindMany.mockResolvedValue([]);
  mocks.userCount.mockResolvedValue(0);
});

describe("getAdminUsersPageData", () => {
  it("requires the admin guard before reading users", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("forbidden"));

    await expect(getAdminUsersPageData("")).rejects.toThrow("forbidden");

    expect(mocks.userFindMany).not.toHaveBeenCalled();
    expect(mocks.userCount).not.toHaveBeenCalled();
  });

  it("returns searched users ordered by registration date with the total user count", async () => {
    const registeredAt = new Date("2026-06-01T12:00:00Z");
    const user = {
      id: "user-1",
      name: "Ana Silva",
      email: "ana@example.com",
      hiddenFromGlobalRanking: false,
      createdAt: registeredAt,
    };

    mocks.userFindMany.mockResolvedValue([user]);
    mocks.userCount.mockResolvedValue(12);

    await expect(getAdminUsersPageData("ana")).resolves.toEqual({
      users: [user],
      totalUsers: 12,
    });
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: "ana", mode: "insensitive" } },
          { email: { contains: "ana", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        hiddenFromGlobalRanking: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
    });
    expect(mocks.userCount).toHaveBeenCalledWith();
  });

  it("counts total users without applying the search filter", async () => {
    await getAdminUsersPageData("maria");

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: "maria", mode: "insensitive" } },
            { email: { contains: "maria", mode: "insensitive" } },
          ],
        },
      }),
    );
    expect(mocks.userCount).toHaveBeenCalledWith();
  });
});
