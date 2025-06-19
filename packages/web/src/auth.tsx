import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createApiClient } from "@tech-zone-store/sdk";
import { useRouter } from "@tanstack/react-router";

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

  const client = createApiClient({
    baseUrl: "/api/v1",
  });

  const login = useCallback(async (username: string, password: string) => {
    const { data: user } = await client.POST("/auth/login", {
      body: {
        organization: "tech-zone",
        username,
        password,
      },
    });

    if (!user) throw new Error("Login failed");

    setStoredUser(user);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await client.POST("/auth/logout", {
      headers: {
        Authorization: `Bearer ${user?.accessToken}`,
      },
    });

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
