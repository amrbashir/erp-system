import { useMutation } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
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
  const storageChange = (e: StorageEvent) =>
    e.key === USER_KEY ? setUser(e.newValue ? getStoredUser() : null) : {};

  useEffect(() => {
    window.addEventListener("storage", storageChange);
    return () => window.removeEventListener("storage", storageChange);
  }, []);

  // login
  const loginMutation = useMutation({
    mutationFn: async (value: { username: string; password: string; orgSlug: string }) =>
      apiClient.post("/orgs/{orgSlug}/auth/login", {
        params: { path: { orgSlug: value.orgSlug } },
        body: {
          username: value.username,
          password: value.password,
        },
      }),
  });

  const login = async (username: string, password: string, orgSlug: string) => {
    const { data: user, error } = await loginMutation.mutateAsync({
      username,
      password,
      orgSlug,
    });

    if (error) throw error;

    setStoredUser(user);
    setUser(user);
  };

  // logout
  const logoutMutation = useMutation({
    mutationFn: async (orgSlug: string) =>
      await apiClient.get("/orgs/{orgSlug}/auth/logout", {
        params: { path: { orgSlug } },
      }),
  });

  const logout = async (orgSlug: string) => {
    await logoutMutation.mutateAsync(orgSlug);

    setStoredUser(null);
    setUser(null);
  };

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
