import { useAuth } from "@/providers/auth.tsx";

export function useAuthUser() {
  const { user } = useAuth();
  if (!user) {
    throw new Error(
      "useAuthUser must be used within an AuthProvider and user must be authenticated",
    );
  }
  return user;
}
