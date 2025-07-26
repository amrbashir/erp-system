import type { LoginResponseDto } from "@erp-system/sdk/zod";
import type z from "zod";

export const USER_KEY = "user";

export type AuthUser = z.infer<typeof LoginResponseDto>;
export type UserRole = AuthUser["role"];

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
