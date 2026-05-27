import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncUser } from "@/lib/user-sync";

const mocks = vi.hoisted(() => {
  class MockPrismaError extends Error {
    code: string;
    meta: { target?: string[] };
    constructor(code: string, target?: string[]) {
      super(`Prisma error ${code}`);
      this.code = code;
      this.meta = { target };
    }
  }

  return {
    userFindUnique: vi.fn(),
    userUpdate: vi.fn(),
    userCreate: vi.fn(),
    MockPrismaError,
  };
});

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
      create: mocks.userCreate,
    },
  }),
}));

// We need to mock Prisma namespace to use instanceof check in syncUser
// Note: In real syncUser, it's imported from @/generated/prisma/client
vi.mock("@/generated/prisma/client", () => {
  return {
    Prisma: {
      PrismaClientKnownRequestError: mocks.MockPrismaError,
    },
  };
});

describe("syncUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an existing user found by keycloakId", async () => {
    const identity = { keycloakId: "k1" };
    const profile = { keycloakId: "k1", name: "User 1", email: "user1@example.com", image: "img1" };
    const existingUser = { id: "u1", keycloakId: "k1", email: "old@example.com" };

    mocks.userFindUnique.mockResolvedValueOnce(existingUser);
    mocks.userUpdate.mockResolvedValueOnce({ ...existingUser, ...profile });

    const result = await syncUser(identity, profile);

    expect(mocks.userFindUnique).toHaveBeenCalledWith({ where: { keycloakId: "k1" } });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { keycloakId: "k1", name: "User 1", email: "user1@example.com", image: "img1" },
    });
    expect(result.email).toBe("user1@example.com");
  });

  it("links a user by email if keycloakId is not found", async () => {
    const identity = { keycloakId: "new-k1" };
    const profile = { keycloakId: "new-k1", name: "User 1", email: "user1@example.com", image: "img1" };
    const existingUserByEmail = { id: "u1", keycloakId: "old-k1", email: "user1@example.com" };

    mocks.userFindUnique
      .mockResolvedValueOnce(null) // by keycloakId
      .mockResolvedValueOnce(existingUserByEmail); // by email

    mocks.userUpdate.mockResolvedValueOnce({ ...existingUserByEmail, keycloakId: "new-k1" });

    const result = await syncUser(identity, profile);

    expect(mocks.userFindUnique).toHaveBeenCalledTimes(2);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { keycloakId: "new-k1", name: "User 1", email: "user1@example.com", image: "img1" },
    });
    expect(result.keycloakId).toBe("new-k1");
  });

  it("handles email conflict during update by skipping email update", async () => {
    const identity = { keycloakId: "k1" };
    const profile = { keycloakId: "k1", name: "User 1", email: "taken@example.com", image: "img1" };
    const existingUser = { id: "u1", keycloakId: "k1", email: "user1@example.com" };

    mocks.userFindUnique.mockResolvedValueOnce(existingUser);
    
    // First update fails due to email conflict
    mocks.userUpdate.mockRejectedValueOnce(new mocks.MockPrismaError("P2002", ["email"]));
    // Second update succeeds without email
    mocks.userUpdate.mockResolvedValueOnce({ ...existingUser, name: "User 1" });

    await syncUser(identity, profile);

    expect(mocks.userUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.userUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "u1" },
      data: { keycloakId: "k1", name: "User 1", image: "img1" },
    });
  });

  it("handles email conflict during creation by skipping email", async () => {
    const identity = { keycloakId: "k1" };
    const profile = { keycloakId: "k1", name: "User 1", email: "taken@example.com", image: "img1" };

    mocks.userFindUnique.mockResolvedValue(null);
    
    // First create fails
    mocks.userCreate.mockRejectedValueOnce(new mocks.MockPrismaError("P2002", ["email"]));
    // Second create succeeds without email
    mocks.userCreate.mockResolvedValueOnce({ id: "u1", keycloakId: "k1", name: "User 1", email: null });

    await syncUser(identity, profile);

    expect(mocks.userCreate).toHaveBeenCalledTimes(2);
    expect(mocks.userCreate).toHaveBeenNthCalledWith(2, {
      data: { keycloakId: "k1", name: "User 1", image: "img1" },
    });
  });


  it("treats empty strings as null", async () => {
    const identity = { keycloakId: "k1" };
    const profile = { keycloakId: "k1", name: "User 1", email: " ", image: "" };

    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValueOnce({ id: "u1", keycloakId: "k1", name: "User 1", email: null });

    await syncUser(identity, profile);

    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: { keycloakId: "k1", name: "User 1", email: null, image: null },
    });
  });
});
