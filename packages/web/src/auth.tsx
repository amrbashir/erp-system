import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "./api-client";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { LoginUserDto } from "@tech-zone-store/sdk/zod";

export interface AuthUser {
  username: string;
  accessToken: string;
}

export interface AuthContext {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContext | null>(null);

const authUserUsernameKey = "auth.user.username";
const authUserAccessTokenKey = "auth.user.accessToken";

function getStoredUser() {
  const username = localStorage.getItem(authUserUsernameKey);
  const accessToken = localStorage.getItem(authUserAccessTokenKey);
  if (username && accessToken) return { username, accessToken };
  return null;
}

function setStoredUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(authUserUsernameKey, user.username);
    localStorage.setItem(authUserAccessTokenKey, user.accessToken);
  } else {
    localStorage.removeItem(authUserUsernameKey);
    localStorage.removeItem(authUserAccessTokenKey);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const isAuthenticated = !!user;

  const loginMutation = useMutation({
    mutationFn: async (value: z.input<typeof LoginUserDto>) => {
      const { data, error } = await apiClient.request("post", "/auth/login", { body: value });
      if (error) throw error;
      return data;
    },
  });

  const login = useCallback(async (username: string, password: string) => {
    const user = await loginMutation.mutateAsync({
      username,
      password,
      organization: "tech-zone",
    });

    setStoredUser(user);
    setUser(user);
  }, []);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.request("post", "/auth/logout", {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });
      if (error) throw error;
    },
  });

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();

    setStoredUser(null);
    setUser(null);
  }, [user]);

  useEffect(() => setUser(getStoredUser()), []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
