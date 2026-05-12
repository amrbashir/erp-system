import { IS_DESKTOP, SIDECAR_URL } from "@workspace/desktop";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: IS_DESKTOP ? SIDECAR_URL : undefined,
	// Cross-origin (tauri://localhost <-> :11435) - cookies need explicit credentials. Server sets SameSite=None+Secure+Partitioned.
	fetchOptions: IS_DESKTOP ? { credentials: "include" } : undefined,
});

export const { useSession, signIn, signUp, signOut } = authClient;
