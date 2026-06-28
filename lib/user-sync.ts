import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

export type UserSyncData = {
  keycloakId: string;
  name: string;
  email: string | null;
  image: string | null;
};

/**
 * Synchronizes user data from Keycloak into our database.
 * Handles account linking by email and graceful fallback for unique constraint violations.
 */
export async function syncUser(identity: { keycloakId: string }, profile: UserSyncData) {
  const email =
    typeof profile.email === "string" && profile.email.trim() !== ""
      ? profile.email
      : null;
  const image =
    typeof profile.image === "string" && profile.image.trim() !== ""
      ? profile.image
      : null;

  const db = getDb();

  // 1. Try to find the user by their Keycloak identity
  let user = await db.user.findUnique({
    where: { keycloakId: identity.keycloakId },
  });

  // 2. If not found, try to find by email to support linking accounts
  if (!user && email) {
    user = await db.user.findUnique({
      where: { email },
    });
  }

  const userData = {
    keycloakId: identity.keycloakId,
    name: profile.name,
    email,
    image,
  };
  const userDataWithoutEmail = {
    keycloakId: identity.keycloakId,
    name: profile.name,
    image,
  };

  if (user) {
    try {
      // Update existing user (either matched by keycloakId or linked via email)
      return await db.user.update({
        where: { id: user.id },
        data: userData,
      });
    } catch (error) {
      // If email is already taken by another user, update everything except email
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return await db.user.update({
          where: { id: user.id },
          data: userDataWithoutEmail,
        });
      }
      throw error;
    }
  } else {
    try {
      // Create new user
      return await db.user.create({
        data: userData,
      });
    } catch (error) {
      // Handle race condition where email was taken since our last check
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return await db.user.create({
          data: userDataWithoutEmail,
        });
      }
      throw error;
    }
  }
}
