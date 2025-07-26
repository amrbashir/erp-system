import { useRouterState } from "@tanstack/react-router";

import type { AuthUser } from "@/user";
import { useAuth } from "@/providers/auth";

export function useAuthUser<TStrict extends boolean = true>(options?: {
  strict?: TStrict;
}): TStrict extends true ? AuthUser : AuthUser | undefined {
  const { user } = useAuth();
  if (!user) {
    throw new Error(
      "useAuthUser must be used within an AuthProvider and user must be authenticated",
    );
  }
  return user as TStrict extends true ? AuthUser : AuthUser | undefined;
}
