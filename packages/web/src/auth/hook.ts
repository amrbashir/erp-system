import { createContext, useContext } from "react";
import type { AuthUser } from "@/auth/user";

export interface AuthContext {
  isAuthenticated: boolean;
  login: (username: string, password: string, orgSlug: string) => Promise<void>;
  logout: (orgSlug: string) => Promise<void>;
  user: AuthUser | null;
}

export const AuthContext = createContext<AuthContext | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
