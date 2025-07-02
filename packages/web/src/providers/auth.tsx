import { LoginUserDto } from "@erp-system/sdk/zod";
import { useMutation } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { z } from "zod";

import type { ReactNode } from "react";

import type { AuthUser } from "@/user";
import { apiClient } from "@/api-client";
import { getStoredUser, setStoredUser, USER_KEY } from "@/user";

export interface AuthProviderState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, orgSlug: string) => Promise<void>;
  logout: (orgSlug: string) => Promise<void>;
}

const AuthContext = createContext<AuthProviderState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const isAuthenticated = !!user;

  // Handle storage changes to update the user state
  const storageChange = useCallback(
    (e: StorageEvent) => (e.key === USER_KEY ? setUser(e.newValue ? getStoredUser() : null) : {}),
    [setUser],
  );

  useEffect(() => {
    window.addEventListener("storage", storageChange);
    return () => window.removeEventListener("storage", storageChange);
  }, [storageChange]);

  // login
  const loginMutation = useMutation({
    mutationFn: async (value: z.input<typeof LoginUserDto> & { orgSlug: string }) =>
      apiClient.post("/org/{orgSlug}/auth/login", {
        body: value,
        params: { path: { orgSlug: value.orgSlug } },
      }),
  });

  const login = useCallback(
    async (username: string, password: string, orgSlug: string) => {
      const { data: user, error } = await loginMutation.mutateAsync({
        username,
        password,
        orgSlug,
      });

      if (error) throw error;

      setStoredUser(user);
      setUser(user);
    },
    [setUser],
  );

  // logout
  const logoutMutation = useMutation({
    mutationFn: async (orgSlug: string) =>
      await apiClient.post("/org/{orgSlug}/auth/logout", {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
        // @ts-expect-error - incorrect type generation by openapi-typescript
        params: { path: { orgSlug } },
      }),
  });

  const logout = useCallback(
    async (orgSlug: string) => {
      await logoutMutation.mutateAsync(orgSlug);

      setStoredUser(null);
      setUser(null);
    },
    [setUser],
  );

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
