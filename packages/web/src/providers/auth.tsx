import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

import type { LoginResponse } from "@erp-system/server/dto";
import type { AppRouter } from "@erp-system/server/trpc/router";
import type { TRPCClientErrorLike } from "@trpc/client";

import { trpc, trpcClient } from "@/trpc.ts";

export type AuthUser = LoginResponse;

export interface AuthProviderStateAuthed {
  user: AuthUser;
  isAuthenticated: true;
}

export interface AuthProviderStateUnauthed {
  user: null;
  isAuthenticated: false;
}

export interface AuthProviderStateBase {
  login: (username: string, password: string, orgSlug: string) => Promise<void>;
  loginError: TRPCClientErrorLike<AppRouter> | undefined;
  loginIsError: boolean;
  logout: () => Promise<void>;
}

export type AuthProviderState = AuthProviderStateBase &
  (AuthProviderStateAuthed | AuthProviderStateUnauthed);

const AuthContext = React.createContext<AuthProviderState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch the current user on mount
  React.useEffect(() => {
    trpcClient.orgs.auth.me
      .query()
      .then((user) => {
        setUser(user);
        setIsAuthenticated(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // login
  const loginMutation = useMutation(trpc.orgs.auth.login.mutationOptions());
  const login = async (username: string, password: string, orgSlug: string) => {
    const userData = await loginMutation.mutateAsync({ username, password, orgSlug });
    setUser(userData);
    setIsAuthenticated(true);
  };

  // logout
  const logoutMutation = useMutation(trpc.orgs.auth.logout.mutationOptions());
  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await logoutMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loader2Icon className="animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={
        {
          isAuthenticated,
          user,
          login,
          loginError: loginMutation.error as TRPCClientErrorLike<AppRouter>,
          loginIsError: loginMutation.isError,
          logout,
        } as AuthProviderState
      }
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
