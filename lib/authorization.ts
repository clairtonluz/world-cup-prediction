export type AppRole = "USER" | "ADMIN";

export interface RoleHolder {
  roles?: readonly AppRole[] | null;
}

export function hasRole(user: RoleHolder | null | undefined, role: AppRole) {
  return user?.roles?.includes(role) ?? false;
}

export function isAdmin(user: RoleHolder | null | undefined) {
  return hasRole(user, "ADMIN");
}

export function isUser(user: RoleHolder | null | undefined) {
  return hasRole(user, "USER") || isAdmin(user);
}
