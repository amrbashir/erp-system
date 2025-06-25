import type { UserEntity } from "@erp-system/sdk/zod";
import type z from "zod";

const authUserUsernameKey = "auth.user.username";
const authUserAccessTokenKey = "auth.user.accessToken";
const authUserRoleKey = "auth.user.role";

export type UserRole = z.infer<typeof UserEntity>["role"];

export interface AuthUser {
  username: string;
  role: UserRole;
  accessToken: string;
}

export function getStoredUser(): AuthUser | null {
  const username = localStorage.getItem(authUserUsernameKey);
  const accessToken = localStorage.getItem(authUserAccessTokenKey);
  const role = localStorage.getItem(authUserRoleKey);
  if (!username || !accessToken || !role) return null;
  return { username, accessToken, role: role as UserRole };
}

export function setStoredUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(authUserUsernameKey, user.username);
    localStorage.setItem(authUserAccessTokenKey, user.accessToken);
    localStorage.setItem(authUserRoleKey, user.role);
  } else {
    localStorage.removeItem(authUserUsernameKey);
    localStorage.removeItem(authUserAccessTokenKey);
    localStorage.removeItem(authUserRoleKey);
  }
}

export function isStorageKeyForUser(key: string | null): boolean {
  return key === authUserUsernameKey || key === authUserAccessTokenKey || key === authUserRoleKey;
}
