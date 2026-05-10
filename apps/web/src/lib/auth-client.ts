import { createAuthClient } from "better-auth/react";

import { isDesktop } from "./activation";
import { SIDECAR_URL } from "./sidecar";

const desktop = isDesktop();

export const authClient = createAuthClient({
	baseURL: desktop ? SIDECAR_URL : undefined,
	// Cross-origin (tauri://localhost <-> :11435) - cookies need explicit credentials. Server sets SameSite=None+Secure+Partitioned.
	fetchOptions: desktop ? { credentials: "include" } : undefined,
});

export const { useSession, signIn, signUp, signOut } = authClient;
