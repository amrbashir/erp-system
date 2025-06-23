import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "./api-client";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { LoginUserDto, UserEntity } from "@tech-zone-store/sdk/zod";

type UserRole = z.infer<typeof UserEntity>["role"];

export interface AuthUser {
  username: string;
  role: UserRole;
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
const authUserRoleKey = "auth.user.role";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const isAuthenticated = useMemo(() => !!user, [user]);

  // Handle storage changes to update the user state
  const storageChange = useCallback(
    (e: StorageEvent) => {
      if (
        e.key === authUserUsernameKey ||
        e.key === authUserAccessTokenKey ||
        e.key === authUserRoleKey
      ) {
        // If the new value is set, update the user state
        if (e.newValue) {
          const storedUser = getStoredUser();
          setUser(storedUser);
        } else {
          // If the new value is removed, clear the user state
          setUser(null);
        }
      }
    },
    [setUser],
  );

  useEffect(() => {
    window.addEventListener("storage", (e) => storageChange(e));
    return () => window.removeEventListener("storage", (e) => storageChange(e));
  }, [storageChange]);

  // login
  const loginMutation = useMutation({
    mutationFn: async (value: z.input<typeof LoginUserDto>) =>
      apiRequest("post", "/auth/login", { body: value }),
  });

  const login = useCallback(async (username: string, password: string) => {
    const { data: user, error } = await loginMutation.mutateAsync({
      username,
      password,
      organization: "tech-zone",
    });

    if (!user) throw new Error(`Login failed: ${(error as any)?.message}`);

    setStoredUser(user);
    setUser(user);
  }, []);

  // logout
  const logoutMutation = useMutation({
    mutationFn: async () =>
      await apiRequest("post", "/auth/logout", {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      }),
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
