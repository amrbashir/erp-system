import type { UserEntity } from "@erp-system/sdk/zod";
import type z from "zod";

export const USER_KEY = "user";

export type UserRole = z.infer<typeof UserEntity>["role"];

export interface AuthUser {
  username: string;
  role: UserRole;
  orgSlug: string;
}

export function getStoredUser(): AuthUser | null {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  return JSON.parse(user) as AuthUser;
}

export function setStoredUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}
